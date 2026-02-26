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
import { CalendarDays, CheckCircle2, Clock, Loader2, Image, ImageOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const extrairFotoUrl = (observacao: string | null) => {
  if (!observacao) return null
  const match = observacao.match(/Foto comprovante: (.+)/)
  return match ? match[1].trim() : null
}

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
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null)
  const [filtroUFRotaDia, setFiltroUFRotaDia] = useState<string>('todas')
  const [buscaColeta, setBuscaColeta] = useState('')
  const [itensPorPagina, setItensPorPagina] = useState<number>(10)

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

  const { data: servicosExecutadosNoDia, isLoading: loadingExecutadosNoDia } = useQuery({
    queryKey: ['servicos-executados-dia', dataSelecionada],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select('empreendimento_id')
        .eq('tipo_servico', 'leitura')
        .eq('status_atendimento', 'executado')
        .eq('data_agendamento', dataSelecionada)
        .not('empreendimento_id', 'is', null)

      if (error) throw error
      return (data || [])
        .map(item => item.empreendimento_id)
        .filter((id): id is string => !!id)
    }
  })

  const empreendimentoIdsExecutadosNoDia = useMemo(
    () => new Set(servicosExecutadosNoDia || []),
    [servicosExecutadosNoDia]
  )

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
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>Rota do Dia</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={filtroUFRotaDia} onValueChange={setFiltroUFRotaDia}>
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
                <Input
                  type="date"
                  value={dataSelecionada}
                  onChange={e => setDataSelecionada(e.target.value)}
                  className="w-48"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingRotas || loadingExecutadosNoDia ? (
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
                    {rotasDoDia.filter(rota => {
                      const emp = rota.empreendimentos_terceirizados as any
                      return filtroUFRotaDia === 'todas' || emp?.uf === filtroUFRotaDia
                    }).map(rota => {
                      const emp = rota.empreendimentos_terceirizados as any
                      const op = rota.operadores as any
                      const empreendimentoIdRota = emp?.id || rota.empreendimento_id
                      const statusEfetivo =
                        rota.status === 'concluido' ||
                        (empreendimentoIdRota && empreendimentoIdsExecutadosNoDia.has(empreendimentoIdRota))
                          ? 'concluido'
                          : rota.status
                      return (
                        <TableRow key={rota.id}>
                          <TableCell className="font-medium">{emp?.nome || '-'}</TableCell>
                          <TableCell>{emp?.rota || '-'}</TableCell>
                          <TableCell>{emp?.quantidade_medidores || 0}</TableCell>
                          <TableCell>{op?.nome || 'Não atribuído'}</TableCell>
                          <TableCell>{statusBadge(statusEfetivo)}</TableCell>
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
                <Input
                  placeholder="Buscar condomínio..."
                  value={buscaColeta}
                  onChange={e => setBuscaColeta(e.target.value)}
                  className="w-56"
                />
                <Select value={String(itensPorPagina)} onValueChange={v => setItensPorPagina(Number(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingColetas ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (() => {
                const coletasBuscadas = coletasFiltradas.filter(c => {
                  if (!buscaColeta) return true
                  const emp = c.empreendimentos_terceirizados as any
                  return emp?.nome?.toLowerCase().includes(buscaColeta.toLowerCase())
                })
                const coletasExibidas = coletasBuscadas.slice(0, itensPorPagina)
                return !coletasBuscadas.length ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma coleta encontrada.</p>
                ) : (
                  <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Condomínio</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Medidores</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Data da Coleta</TableHead>
                      <TableHead>Foto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coletasExibidas.map(coleta => {
                      const emp = coleta.empreendimentos_terceirizados as any
                      const tecnico = coleta.operadores as any
                      const fotoUrl = extrairFotoUrl(coleta.observacao)
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
                          <TableCell>
                            {fotoUrl ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFotoSelecionada(fotoUrl)}
                                title="Ver foto"
                              >
                                <Image className="h-4 w-4 text-primary" />
                              </Button>
                            ) : (
                              <ImageOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <p className="text-sm text-muted-foreground mt-3">
                  Mostrando {coletasExibidas.length} de {coletasBuscadas.length} coletas
                </p>
                  </>
                )
              })()}
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

      <Dialog open={!!fotoSelecionada} onOpenChange={(open) => !open && setFotoSelecionada(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Foto Comprovante</DialogTitle>
            <p className="text-sm text-muted-foreground">Clique na imagem para ampliar em nova aba</p>
          </DialogHeader>
          {fotoSelecionada && (
            <img
              src={fotoSelecionada}
              alt="Foto comprovante da coleta"
              className="w-full max-h-[60vh] object-contain rounded-md cursor-pointer"
              onClick={() => window.open(fotoSelecionada, '_blank')}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFotoSelecionada(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
