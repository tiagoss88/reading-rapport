import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Trash2, Users, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DiaUtilDialog from '@/components/medicao-terceirizada/DiaUtilDialog'
import RotaDiariaDialog from '@/components/medicao-terceirizada/RotaDiariaDialog'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

const meses = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
]

const currentYear = new Date().getFullYear()
const anos = Array.from({ length: 5 }, (_, i) => currentYear + i)

export default function PlanejamentoRotas() {
  const [uf, setUf] = useState<string>('BA')
  const [ano, setAno] = useState<string>(currentYear.toString())
  const [mes, setMes] = useState<string>((new Date().getMonth() + 1).toString())
  const [diaUtilDialogOpen, setDiaUtilDialogOpen] = useState(false)
  const [rotaDiariaDialogOpen, setRotaDiariaDialogOpen] = useState(false)
  const [selectedDiaUtil, setSelectedDiaUtil] = useState<any>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: diasUteis, isLoading: loadingDias } = useQuery({
    queryKey: ['dias-uteis', uf, ano, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dias_uteis')
        .select('*')
        .eq('uf', uf)
        .eq('ano', parseInt(ano))
        .eq('mes', parseInt(mes))
        .order('numero_rota', { ascending: true })
      
      if (error) throw error
      return data
    }
  })

  const { data: empreendimentos } = useQuery({
    queryKey: ['empreendimentos-terceirizados-por-rota'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .order('rota', { ascending: true })
      
      if (error) throw error
      return data
    }
  })

  const { data: rotasLeitura } = useQuery({
    queryKey: ['rotas-leitura', uf, ano, mes],
    queryFn: async () => {
      const startDate = `${ano}-${mes.padStart(2, '0')}-01`
      const endDate = `${ano}-${mes.padStart(2, '0')}-31`
      
      const { data, error } = await supabase
        .from('rotas_leitura')
        .select(`
          *,
          empreendimento:empreendimentos_terceirizados(nome, uf),
          operador:operadores(nome)
        `)
        .gte('data', startDate)
        .lte('data', endDate)
      
      if (error) throw error
      return data
    }
  })

  const deleteDiaUtilMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dias_uteis')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dias-uteis'] })
      toast({ title: 'Dia útil excluído com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao excluir dia útil', variant: 'destructive' })
    }
  })

  const getEmpreendimentosPorRota = (rota: number) => {
    return empreendimentos?.filter(e => e.rota === rota && e.uf === uf) || []
  }

  const getRotasLeituraParaData = (data: string) => {
    return rotasLeitura?.filter(r => r.data === data) || []
  }

  const handleVerDetalhes = (diaUtil: any) => {
    setSelectedDiaUtil(diaUtil)
    setRotaDiariaDialogOpen(true)
  }

  return (
    <Layout title="Planejamento de Rotas de Leitura">
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Selecionar Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setDiaUtilDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Dia Útil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Dias Úteis */}
        <Card>
          <CardHeader>
            <CardTitle>
              Dias Úteis - {meses.find(m => m.value === mes)?.label} {ano} ({uf})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDias ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : diasUteis?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dia útil cadastrado para este período
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Rota</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Empreendimentos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diasUteis?.map((dia) => {
                      const emps = getEmpreendimentosPorRota(dia.numero_rota)
                      const rotasDodia = getRotasLeituraParaData(dia.data)
                      const totalMedidores = emps.reduce((acc, e) => acc + e.quantidade_medidores, 0)
                      
                      return (
                        <TableRow key={dia.id}>
                          <TableCell className="font-medium">
                            Rota {dia.numero_rota.toString().padStart(2, '0')}
                          </TableCell>
                          <TableCell>
                            {format(parse(dia.data, 'yyyy-MM-dd', new Date()), "dd 'de' MMMM", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{emps.length} empreendimento(s)</span>
                              <span className="text-muted-foreground">• {totalMedidores} medidores</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {rotasDodia.length > 0 ? (
                              <Badge variant="secondary">
                                <Users className="mr-1 h-3 w-3" />
                                {rotasDodia.length} operador(es)
                              </Badge>
                            ) : (
                              <Badge variant="outline">Não planejado</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleVerDetalhes(dia)}
                              >
                                Planejar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Dia Útil</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este dia útil? As rotas de leitura associadas também serão afetadas.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteDiaUtilMutation.mutate(dia.id)}>
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DiaUtilDialog
        open={diaUtilDialogOpen}
        onOpenChange={setDiaUtilDialogOpen}
        uf={uf}
        ano={parseInt(ano)}
        mes={parseInt(mes)}
      />

      {selectedDiaUtil && (
        <RotaDiariaDialog
          open={rotaDiariaDialogOpen}
          onOpenChange={setRotaDiariaDialogOpen}
          diaUtil={selectedDiaUtil}
        />
      )}
    </Layout>
  )
}
