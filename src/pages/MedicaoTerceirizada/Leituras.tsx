import { useState, useMemo } from 'react'
import Layout from '@/components/Layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, CheckCircle2, Clock, Loader2 } from 'lucide-react'

const statusBadge = (status: string) => {
  switch (status) {
    case 'concluido':
      return <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">Concluído</Badge>
    case 'em_andamento':
      return <Badge className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">Em andamento</Badge>
    case 'pendente':
    default:
      return <Badge variant="outline">Pendente</Badge>
  }
}

function getCompetenciaAtual() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function LeiturasTerceirizadas() {
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [competencia, setCompetencia] = useState(getCompetenciaAtual())
  const [filtroUF, setFiltroUF] = useState<string>('todas')
  const [filtroRota, setFiltroRota] = useState<string>('todas')

  // Aba 1 - Rota do Dia
  const { data: rotasDoDia, isLoading: loadingRotas } = useQuery({
    queryKey: ['rotas-leitura-dia', dataSelecionada],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rotas_leitura')
        .select('*, empreendimentos_terceirizados(*), operadores(*)')
        .eq('data', dataSelecionada)
        .order('created_at')
      if (error) throw error
      return data || []
    }
  })

  // Aba 2 - Coletas Realizadas
  const { data: coletasRealizadas, isLoading: loadingColetas } = useQuery({
    queryKey: ['coletas-realizadas', competencia],
    queryFn: async () => {
      const [ano, mes] = competencia.split('-')
      const inicioMes = `${ano}-${mes}-01`
      const ultimoDia = new Date(Number(ano), Number(mes), 0).getDate()
      const fimMes = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select('*, empreendimentos_terceirizados(*), operadores:tecnico_id(id, nome)')
        .eq('tipo_servico', 'leitura')
        .eq('status_atendimento', 'executado')
        .gte('data_agendamento', inicioMes)
        .lte('data_agendamento', fimMes)
        .order('data_agendamento', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Todos os empreendimentos (para calcular pendentes)
  const { data: todosEmpreendimentos, isLoading: loadingEmpreendimentos } = useQuery({
    queryKey: ['empreendimentos-terceirizados-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .order('rota')
      if (error) throw error
      return data || []
    }
  })

  // UFs e Rotas únicas para filtros
  const ufsDisponiveis = useMemo(() => {
    if (!todosEmpreendimentos) return []
    return [...new Set(todosEmpreendimentos.map(e => e.uf))].sort()
  }, [todosEmpreendimentos])

  const rotasDisponiveis = useMemo(() => {
    if (!todosEmpreendimentos) return []
    return [...new Set(todosEmpreendimentos.map(e => e.rota))].sort((a, b) => a - b)
  }, [todosEmpreendimentos])

  // Pendentes: empreendimentos sem coleta na competência
  const pendentes = useMemo(() => {
    if (!todosEmpreendimentos || !coletasRealizadas) return []
    const idsColetados = new Set(
      coletasRealizadas
        .filter(c => c.empreendimento_id)
        .map(c => c.empreendimento_id)
    )
    return todosEmpreendimentos.filter(e => !idsColetados.has(e.id))
  }, [todosEmpreendimentos, coletasRealizadas])

  // Filtros aplicados nas coletas
  const coletasFiltradas = useMemo(() => {
    if (!coletasRealizadas) return []
    return coletasRealizadas.filter(c => {
      const emp = c.empreendimentos_terceirizados as any
      if (filtroUF !== 'todas' && emp?.uf !== filtroUF) return false
      if (filtroRota !== 'todas' && String(emp?.rota) !== filtroRota) return false
      return true
    })
  }, [coletasRealizadas, filtroUF, filtroRota])

  // Filtros aplicados nos pendentes
  const pendentesFiltrados = useMemo(() => {
    return pendentes.filter(e => {
      if (filtroUF !== 'todas' && e.uf !== filtroUF) return false
      if (filtroRota !== 'todas' && String(e.rota) !== filtroRota) return false
      return true
    })
  }, [pendentes, filtroUF, filtroRota])

  // Gerar opções de competência (últimos 12 meses)
  const competenciaOptions = useMemo(() => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = format(d, 'MMMM yyyy', { locale: ptBR })
      options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }
    return options
  }, [])

  return (
    <Layout title="Leituras - Medição Terceirizada">
      <Tabs defaultValue="rota-dia" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rota-dia" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Rota do Dia
          </TabsTrigger>
          <TabsTrigger value="realizadas" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Coletas Realizadas
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
          </TabsTrigger>
        </TabsList>

        {/* Aba 1 - Rota do Dia */}
        <TabsContent value="rota-dia">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rota do Dia</CardTitle>
              <Input
                type="date"
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                className="w-48"
              />
            </CardHeader>
            <CardContent>
              {loadingRotas ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !rotasDoDia?.length ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma rota planejada para este dia.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Condomínio</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Medidores</TableHead>
                      <TableHead>Operador Atribuído</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rotasDoDia.map(rota => {
                      const emp = rota.empreendimentos_terceirizados as any
                      const op = rota.operadores as any
                      return (
                        <TableRow key={rota.id}>
                          <TableCell className="font-medium">{emp?.nome || '-'}</TableCell>
                          <TableCell>{emp?.rota || '-'}</TableCell>
                          <TableCell>{emp?.quantidade_medidores || 0}</TableCell>
                          <TableCell>{op?.nome || 'Não atribuído'}</TableCell>
                          <TableCell>{statusBadge(rota.status)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2 - Coletas Realizadas */}
        <TabsContent value="realizadas">
          <Card>
            <CardHeader>
              <CardTitle>Coletas Realizadas</CardTitle>
              <div className="flex flex-wrap gap-3 mt-2">
                <Select value={competencia} onValueChange={setCompetencia}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Competência" />
                  </SelectTrigger>
                  <SelectContent>
                    {competenciaOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroUF} onValueChange={setFiltroUF}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas UFs</SelectItem>
                    {ufsDisponiveis.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroRota} onValueChange={setFiltroRota}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Rota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas Rotas</SelectItem>
                    {rotasDisponiveis.map(r => (
                      <SelectItem key={r} value={String(r)}>Rota {r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingColetas ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !coletasFiltradas.length ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma coleta realizada nesta competência.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Condomínio</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Medidores</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Data da Coleta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coletasFiltradas.map(coleta => {
                      const emp = coleta.empreendimentos_terceirizados as any
                      const tecnico = coleta.operadores as any
                      return (
                        <TableRow key={coleta.id}>
                          <TableCell className="font-medium">{emp?.nome || coleta.condominio_nome_original}</TableCell>
                          <TableCell>{emp?.uf || coleta.uf}</TableCell>
                          <TableCell>{emp?.rota || '-'}</TableCell>
                          <TableCell>{emp?.quantidade_medidores || 0}</TableCell>
                          <TableCell>{tecnico?.nome || 'N/A'}</TableCell>
                          <TableCell>
                            {coleta.data_agendamento
                              ? format(parseISO(coleta.data_agendamento), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3 - Pendentes */}
        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pendentes
                {pendentes.length > 0 && (
                  <Badge variant="destructive">{pendentesFiltrados.length}</Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap gap-3 mt-2">
                <Select value={competencia} onValueChange={setCompetencia}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Competência" />
                  </SelectTrigger>
                  <SelectContent>
                    {competenciaOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroUF} onValueChange={setFiltroUF}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas UFs</SelectItem>
                    {ufsDisponiveis.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroRota} onValueChange={setFiltroRota}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Rota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas Rotas</SelectItem>
                    {rotasDisponiveis.map(r => (
                      <SelectItem key={r} value={String(r)}>Rota {r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEmpreendimentos || loadingColetas ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !pendentesFiltrados.length ? (
                <p className="text-center text-muted-foreground py-8">Todos os condomínios já foram coletados nesta competência! 🎉</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Condomínio</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Medidores</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendentesFiltrados.map(emp => (
                      <TableRow key={emp.id} className="bg-destructive/5">
                        <TableCell className="font-medium">{emp.nome}</TableCell>
                        <TableCell>{emp.uf}</TableCell>
                        <TableCell>{emp.rota}</TableCell>
                        <TableCell>{emp.quantidade_medidores}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  )
}
