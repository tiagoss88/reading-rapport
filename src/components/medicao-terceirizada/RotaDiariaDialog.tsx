import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, Building2, Users, ChevronDown } from 'lucide-react'

interface DiaUtil {
  id: string
  uf: string
  ano: number
  mes: number
  numero_rota: number
  data: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  diaUtil: DiaUtil
}

interface EmpreendimentoGroup {
  empreendimento_id: string
  nome: string
  quantidade_medidores: number
  rotas: Array<{
    id: string
    operador_id: string | null
    operador_nome: string | null
    status: string
  }>
}

export default function RotaDiariaDialog({ open, onOpenChange, diaUtil }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<string>('')

  const { data: empreendimentos } = useQuery({
    queryKey: ['empreendimentos-terceirizados-rota', diaUtil.numero_rota, diaUtil.uf],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .eq('rota', diaUtil.numero_rota)
        .eq('uf', diaUtil.uf)
        .order('nome', { ascending: true })
      
      if (error) throw error
      return data
    }
  })

  const { data: operadores } = useQuery({
    queryKey: ['operadores-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operadores')
        .select('*')
        .eq('status', 'ativo')
        .order('nome', { ascending: true })
      
      if (error) throw error
      return data
    }
  })

  const { data: rotasLeitura, isLoading } = useQuery({
    queryKey: ['rotas-leitura-dia', diaUtil.data],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rotas_leitura')
        .select(`
          *,
          empreendimento:empreendimentos_terceirizados(id, nome, quantidade_medidores),
          operador:operadores(id, nome)
        `)
        .eq('data', diaUtil.data)
      
      if (error) throw error
      return data
    }
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['rotas-leitura-dia'] })
    queryClient.invalidateQueries({ queryKey: ['rotas-leitura'] })
  }

  const addRotaMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmpreendimento) {
        throw new Error('Selecione um empreendimento')
      }
      
      const { error } = await supabase
        .from('rotas_leitura')
        .insert({
          data: diaUtil.data,
          empreendimento_id: selectedEmpreendimento,
          operador_id: null,
          status: 'pendente'
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Empreendimento adicionado à rota' })
      setSelectedEmpreendimento('')
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao adicionar à rota', variant: 'destructive' })
    }
  })

  const removeRotaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rotas_leitura')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      invalidateAll()
      toast({ title: 'Removido da rota' })
    },
    onError: () => {
      toast({ title: 'Erro ao remover da rota', variant: 'destructive' })
    }
  })

  const toggleOperadorMutation = useMutation({
    mutationFn: async ({ empreendimentoId, operadorId, checked }: { empreendimentoId: string; operadorId: string; checked: boolean }) => {
      if (checked) {
        // Add new rotas_leitura record for this operator
        const { error } = await supabase
          .from('rotas_leitura')
          .insert({
            data: diaUtil.data,
            empreendimento_id: empreendimentoId,
            operador_id: operadorId,
            status: 'pendente'
          })
        if (error) throw error
      } else {
        // Remove the rotas_leitura record for this operator
        const { error } = await supabase
          .from('rotas_leitura')
          .delete()
          .eq('data', diaUtil.data)
          .eq('empreendimento_id', empreendimentoId)
          .eq('operador_id', operadorId)
        if (error) throw error
      }
    },
    onSuccess: () => {
      invalidateAll()
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar operadores', variant: 'destructive' })
    }
  })

  // Group rotas by empreendimento
  const groupedByEmpreendimento: EmpreendimentoGroup[] = (() => {
    if (!rotasLeitura) return []
    const groups: Record<string, EmpreendimentoGroup> = {}
    
    for (const rota of rotasLeitura) {
      const empId = rota.empreendimento_id
      if (!groups[empId]) {
        groups[empId] = {
          empreendimento_id: empId,
          nome: (rota as any).empreendimento?.nome || 'N/A',
          quantidade_medidores: (rota as any).empreendimento?.quantidade_medidores || 0,
          rotas: []
        }
      }
      groups[empId].rotas.push({
        id: rota.id,
        operador_id: rota.operador_id,
        operador_nome: (rota as any).operador?.nome || null,
        status: rota.status
      })
    }
    
    return Object.values(groups)
  })()

  const empreendimentosNaRota = [...new Set(rotasLeitura?.map(r => r.empreendimento_id) || [])]
  const empreendimentosDisponiveis = empreendimentos?.filter(e => !empreendimentosNaRota.includes(e.id)) || []

  const getOperadoresDoEmpreendimento = (empreendimentoId: string): string[] => {
    return rotasLeitura
      ?.filter(r => r.empreendimento_id === empreendimentoId && r.operador_id)
      .map(r => r.operador_id!) || []
  }

  const statusColors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    concluido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-visible flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Planejamento - Rota {diaUtil.numero_rota.toString().padStart(2, '0')} ({diaUtil.uf})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-shrink-0 mb-4 p-3 bg-muted rounded-md text-sm">
          <p><strong>Data:</strong> {format(parse(diaUtil.data, 'yyyy-MM-dd', new Date()), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          <p><strong>Empreendimentos da rota:</strong> {empreendimentos?.length || 0}</p>
        </div>

        {/* Adicionar Empreendimento */}
        <div className="flex-shrink-0 flex gap-2 mb-4">
          <Select value={selectedEmpreendimento} onValueChange={setSelectedEmpreendimento}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um empreendimento para adicionar" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" sideOffset={4} className="z-[200] max-h-[300px] overflow-y-auto">
              {empreendimentosDisponiveis.length === 0 ? (
                <SelectItem value="none" disabled>Todos já adicionados</SelectItem>
              ) : (
                empreendimentosDisponiveis.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome} ({emp.quantidade_medidores} medidores)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => addRotaMutation.mutate()} 
            disabled={!selectedEmpreendimento || addRotaMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Lista de Empreendimentos na Rota */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : groupedByEmpreendimento.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              Nenhum empreendimento adicionado a esta rota ainda
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead className="text-center">Medidores</TableHead>
                    <TableHead>Operadores</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedByEmpreendimento.map((group) => {
                    const operadoresIds = getOperadoresDoEmpreendimento(group.empreendimento_id)
                    const operadoresNomes = group.rotas
                      .filter(r => r.operador_nome)
                      .map(r => r.operador_nome!)
                    
                    // Get worst status for display
                    const hasAnyStatus = (s: string) => group.rotas.some(r => r.status === s)
                    const displayStatus = hasAnyStatus('pendente') ? 'pendente' : 
                                          hasAnyStatus('em_andamento') ? 'em_andamento' : 'concluido'

                    return (
                      <TableRow key={group.empreendimento_id}>
                        <TableCell className="font-medium">
                          {group.nome}
                        </TableCell>
                        <TableCell className="text-center">
                          {group.quantidade_medidores}
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="w-[220px] justify-between">
                                <span className="truncate text-left">
                                  {operadoresNomes.length === 0 
                                    ? 'Selecionar operadores' 
                                    : `${operadoresNomes.length} operador(es)`}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[260px] p-2 z-[200]" align="start">
                              <div className="space-y-1 max-h-[250px] overflow-y-auto">
                                {operadores?.map(op => {
                                  const isChecked = operadoresIds.includes(op.id)
                                  return (
                                    <label
                                      key={op.id}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        disabled={toggleOperadorMutation.isPending}
                                        onCheckedChange={(checked) => {
                                          toggleOperadorMutation.mutate({
                                            empreendimentoId: group.empreendimento_id,
                                            operadorId: op.id,
                                            checked: !!checked
                                          })
                                        }}
                                      />
                                      {op.nome}
                                    </label>
                                  )
                                })}
                              </div>
                              {operadoresNomes.length > 0 && (
                                <div className="border-t mt-2 pt-2 px-2">
                                  <p className="text-xs text-muted-foreground">
                                    Selecionados: {operadoresNomes.join(', ')}
                                  </p>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[displayStatus]}>
                            {displayStatus === 'pendente' ? 'Pendente' : 
                             displayStatus === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              // Remove all rotas_leitura for this empreendimento on this day
                              group.rotas.forEach(r => removeRotaMutation.mutate(r.id))
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
