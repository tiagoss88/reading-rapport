import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, Building2 } from 'lucide-react'

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

export default function RotaDiariaDialog({ open, onOpenChange, diaUtil }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<string>('')
  const [selectedOperador, setSelectedOperador] = useState<string>('')

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
          operador_id: selectedOperador || null,
          status: 'pendente'
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura-dia'] })
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura'] })
      toast({ title: 'Empreendimento adicionado à rota' })
      setSelectedEmpreendimento('')
      setSelectedOperador('')
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
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura-dia'] })
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura'] })
      toast({ title: 'Removido da rota' })
    },
    onError: () => {
      toast({ title: 'Erro ao remover da rota', variant: 'destructive' })
    }
  })

  const updateOperadorMutation = useMutation({
    mutationFn: async ({ rotaId, operadorId }: { rotaId: string; operadorId: string | null }) => {
      const { error } = await supabase
        .from('rotas_leitura')
        .update({ operador_id: operadorId })
        .eq('id', rotaId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura-dia'] })
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura'] })
      toast({ title: 'Operador atualizado' })
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar operador', variant: 'destructive' })
    }
  })

  const empreendimentosNaRota = rotasLeitura?.map(r => r.empreendimento_id) || []
  const empreendimentosDisponiveis = empreendimentos?.filter(e => !empreendimentosNaRota.includes(e.id)) || []

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

        {/* Adicionar à Rota - Fora da área de scroll */}
        <div className="flex-shrink-0 flex gap-2 mb-4">
          <Select value={selectedEmpreendimento} onValueChange={setSelectedEmpreendimento}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um empreendimento" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[200]">
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
          <Select value={selectedOperador} onValueChange={setSelectedOperador}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Operador (opcional)" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[200]">
              <SelectItem value="none">Sem operador</SelectItem>
              {operadores?.map(op => (
                <SelectItem key={op.id} value={op.id}>{op.nome}</SelectItem>
              ))}
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

        {/* Lista de Rotas do Dia - Com scroll interno */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : rotasLeitura?.length === 0 ? (
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
                    <TableHead>Operador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rotasLeitura?.map((rota) => (
                    <TableRow key={rota.id}>
                      <TableCell className="font-medium">
                        {rota.empreendimento?.nome}
                      </TableCell>
                      <TableCell className="text-center">
                        {rota.empreendimento?.quantidade_medidores}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={rota.operador_id || 'none'} 
                          onValueChange={(value) => updateOperadorMutation.mutate({ 
                            rotaId: rota.id, 
                            operadorId: value === 'none' ? null : value 
                          })}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[200]">
                            <SelectItem value="none">Não atribuído</SelectItem>
                            {operadores?.map(op => (
                              <SelectItem key={op.id} value={op.id}>{op.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[rota.status]}>
                          {rota.status === 'pendente' ? 'Pendente' : 
                           rota.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeRotaMutation.mutate(rota.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
