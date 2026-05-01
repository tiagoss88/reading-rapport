import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Search, FileText, History, Pencil, AlertTriangle, Trash2, CalendarDays, Plus, ChevronLeft, ChevronRight, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import ImportarPlanilhaDialog from '@/components/medicao-terceirizada/ImportarPlanilhaDialog'
import ServicoNacionalGasDialog from '@/components/medicao-terceirizada/ServicoNacionalGasDialog'
import ServicoHistoricoDialog from '@/components/medicao-terceirizada/ServicoHistoricoDialog'
import AgendaSemanal from '@/components/medicao-terceirizada/AgendaSemanal'
import NovoServicoNacionalGasDialog from '@/components/medicao-terceirizada/NovoServicoNacionalGasDialog'
import PainelUrgencias, { getServicosUrgentes } from '@/components/medicao-terceirizada/PainelUrgencias'
import DetalhesExecucaoDialog from '@/components/medicao-terceirizada/DetalhesExecucaoDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ServicoNacionalGas {
  id: string
  data_solicitacao: string | null
  uf: string
  empreendimento_id: string | null
  condominio_nome_original: string
  bloco: string | null
  apartamento: string | null
  fonte: string | null
  morador_nome: string | null
  telefone: string | null
  email: string | null
  tipo_servico: string
  data_agendamento: string | null
  status_atendimento: string
  turno: string | null
  tecnico_id: string | null
  observacao: string | null
  numero_protocolo: string | null
  created_at: string
  empreendimento?: { nome: string } | null
  tecnico?: { nome: string } | null
}

const statusColors: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-800 border border-amber-200',
  agendado: 'bg-blue-50 text-blue-800 border border-blue-200',
  executado: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  cancelado: 'bg-red-50 text-red-800 border border-red-200'
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  executado: 'Executado',
  cancelado: 'Cancelado'
}

type SortColumn = 'protocolo' | 'solicitacao' | 'condominio' | 'morador' | 'status' | null
type SortDirection = 'asc' | 'desc'

export default function ServicosNacionalGas() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [novoDialogOpen, setNovoDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false)
  const [detalhesServicoId, setDetalhesServicoId] = useState<string | null>(null)
  const [selectedServico, setSelectedServico] = useState<ServicoNacionalGas | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [ufFilter, setUfFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('servicos_nacional_gas')
        .delete()
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-nacional-gas'] })
      setSelectedIds(new Set())
      setDeleteDialogOpen(false)
      toast({ title: 'Serviços excluídos com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao excluir serviços', variant: 'destructive' })
    }
  })

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['servicos-nacional-gas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select(`
          *,
          empreendimento:empreendimentos_terceirizados(nome, endereco, rota),
          tecnico:operadores(nome)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ServicoNacionalGas[]
    }
  })

  const servicosSemLeitura = servicos?.filter(s => !s.tipo_servico?.toLowerCase().includes('leitura'))

  const tiposServico = servicosSemLeitura
    ? [...new Set(servicosSemLeitura.map(s => s.tipo_servico))].filter(Boolean).sort()
    : []

  const filteredServicos = servicosSemLeitura?.filter(servico => {
    const matchesSearch = 
      servico.condominio_nome_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.morador_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.apartamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.numero_protocolo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesUf = ufFilter === 'all' || servico.uf === ufFilter
    const matchesStatus = statusFilter === 'all' || servico.status_atendimento === statusFilter
    const matchesTipo = tipoFilter === 'all' || servico.tipo_servico === tipoFilter
    
    return matchesSearch && matchesUf && matchesStatus && matchesTipo
  })

  // Sorting
  const sortedServicos = useMemo(() => {
    if (!filteredServicos || !sortColumn) return filteredServicos
    const sorted = [...filteredServicos]
    sorted.sort((a, b) => {
      let valA = '', valB = ''
      switch (sortColumn) {
        case 'protocolo': valA = a.numero_protocolo || ''; valB = b.numero_protocolo || ''; break
        case 'solicitacao': valA = a.data_solicitacao || ''; valB = b.data_solicitacao || ''; break
        case 'condominio': valA = a.condominio_nome_original; valB = b.condominio_nome_original; break
        case 'morador': valA = a.morador_nome || ''; valB = b.morador_nome || ''; break
        case 'status': valA = a.status_atendimento; valB = b.status_atendimento; break
      }
      const cmp = valA.localeCompare(valB, 'pt-BR')
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [filteredServicos, sortColumn, sortDirection])

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 text-blue-600" /> 
      : <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
  }

  // Reset page when filters change
  const totalFiltered = sortedServicos?.length || 0
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  if (safePage !== currentPage) setCurrentPage(safePage)

  const startIndex = (safePage - 1) * pageSize
  const paginatedServicos = sortedServicos?.slice(startIndex, startIndex + pageSize)

  const handleEdit = (servico: ServicoNacionalGas) => {
    setSelectedServico(servico)
    setEditDialogOpen(true)
  }

  const handleHistorico = (servico: ServicoNacionalGas) => {
    setSelectedServico(servico)
    setHistoricoDialogOpen(true)
  }

  const handleDelete = () => {
    deleteMutation.mutate(Array.from(selectedIds))
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked && filteredServicos) {
      setSelectedIds(new Set(filteredServicos.map(s => s.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const servicosNaoAssociados = servicos?.filter(s => !s.empreendimento_id).length || 0
  const urgentesCount = servicos ? getServicosUrgentes(servicos).length : 0

  return (
    <Layout title="Serviços">
      <div className="space-y-6">
        <Tabs defaultValue="servicos">
          <TabsList>
            <TabsTrigger value="servicos">
              <FileText className="mr-1.5 h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="agenda">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="prazos" className="relative">
              <AlertTriangle className="mr-1.5 h-4 w-4" />
              Urgências
              {urgentesCount > 0 && (
                <Badge className="ml-1.5 h-5 min-w-[20px] px-1.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {urgentesCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servicos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Serviços
                </CardTitle>
                <div className="flex gap-2">
                  {selectedIds.size > 0 && (
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir ({selectedIds.size})
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setNovoDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Serviço
                  </Button>
                  <Button onClick={() => setImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Planilha
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por condomínio, morador, apartamento ou protocolo..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={ufFilter} onValueChange={(v) => { setUfFilter(v); setCurrentPage(1) }}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas UFs</SelectItem>
                      <SelectItem value="BA">BA</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="executado">Executado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v); setCurrentPage(1) }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de Serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {tiposServico.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                      <SelectItem value="250">250 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabela */}
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : (
                  <>
                  <div className="rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80 border-b-2 border-gray-200">
                          <TableHead className="w-[50px] py-3 px-4">
                            <Checkbox
                              checked={filteredServicos && filteredServicos.length > 0 && selectedIds.size === filteredServicos.length}
                              onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                            />
                          </TableHead>
                          <TableHead className="py-3 px-4 cursor-pointer select-none text-[11px] uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700" onClick={() => handleSort('protocolo')}>
                            <span className="flex items-center">Protocolo <SortIcon col="protocolo" /></span>
                          </TableHead>
                          <TableHead className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Origem</TableHead>
                          <TableHead className="py-3 px-4 cursor-pointer select-none text-[11px] uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700" onClick={() => handleSort('solicitacao')}>
                            <span className="flex items-center">Solicitação <SortIcon col="solicitacao" /></span>
                          </TableHead>
                          <TableHead className="py-3 px-4 cursor-pointer select-none text-[11px] uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700" onClick={() => handleSort('condominio')}>
                            <span className="flex items-center">Condomínio <SortIcon col="condominio" /></span>
                          </TableHead>
                          <TableHead className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Bloco/Apto</TableHead>
                          <TableHead className="py-3 px-4 cursor-pointer select-none text-[11px] uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700" onClick={() => handleSort('morador')}>
                            <span className="flex items-center">Morador <SortIcon col="morador" /></span>
                          </TableHead>
                          <TableHead className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Tipo</TableHead>
                          <TableHead className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">UF</TableHead>
                          <TableHead className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Agendamento</TableHead>
                          <TableHead className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Técnico</TableHead>
                          <TableHead className="py-3 px-4 cursor-pointer select-none text-[11px] uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700" onClick={() => handleSort('status')}>
                            <span className="flex items-center">Status <SortIcon col="status" /></span>
                          </TableHead>
                          <TableHead className="w-[110px] py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedServicos?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={13} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-10 w-10 opacity-30" />
                                <span className="text-sm">Nenhum serviço encontrado</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedServicos?.map((servico) => (
                            <TableRow 
                              key={servico.id} 
                              className={`border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50/80 ${!servico.empreendimento_id ? 'bg-amber-50/30' : ''}`}
                            >
                              <TableCell className="py-3 px-4">
                                <Checkbox
                                  checked={selectedIds.has(servico.id)}
                                  onCheckedChange={(checked) => toggleSelectOne(servico.id, !!checked)}
                                />
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <span className="font-mono font-semibold text-gray-900 text-[13px]">{servico.numero_protocolo || '-'}</span>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                {(() => {
                                  const f = servico.fonte?.toLowerCase()
                                  if (f === 'particular') return <Badge variant="secondary" className="text-[11px] font-semibold">Particular</Badge>
                                  if (f === 'bg') return <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-semibold">BG</Badge>
                                  if (f === 'ngd') return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">NGD</Badge>
                                  return <span className="text-muted-foreground">—</span>
                                })()}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-[13px]">
                                {servico.data_solicitacao
                                  ? format(new Date(servico.data_solicitacao + 'T00:00:00'), 'dd/MM/yyyy')
                                  : '-'
                                }
                              </TableCell>
                              <TableCell className="py-3 px-4 max-w-[200px]">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-gray-900 text-[13px] leading-tight">{servico.condominio_nome_original}</span>
                                  {servico.empreendimento ? (
                                    <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 w-fit">✓ Vinculado</span>
                                  ) : (
                                    <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 w-fit">⚠ Não vinculado</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-[13px]">
                                {servico.bloco && <span>Bloco {servico.bloco}</span>}
                                {servico.bloco && servico.apartamento && ' - '}
                                {servico.apartamento && <span>Apto {servico.apartamento}</span>}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-[13px]">{servico.morador_nome || '-'}</TableCell>
                              <TableCell className="py-3 px-4 text-[13px]">{servico.tipo_servico?.toUpperCase()}</TableCell>
                              <TableCell className="py-3 px-4 text-[13px]">{servico.uf}</TableCell>
                              <TableCell className="py-3 px-4 text-[13px]">
                                {servico.data_agendamento 
                                  ? format(new Date(servico.data_agendamento + 'T00:00:00'), 'dd/MM/yyyy')
                                  : '-'
                                }
                                {servico.turno && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({servico.turno === 'manha' ? 'Manhã' : 'Tarde'})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-[13px]">{servico.tecnico?.nome || '-'}</TableCell>
                              <TableCell className="py-3 px-4">
                                <Badge className={`${statusColors[servico.status_atendimento]} px-3 py-1.5 min-w-[100px] text-center text-[12px] font-semibold rounded-md`}>
                                  {statusLabels[servico.status_atendimento]}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEdit(servico)} 
                                    title="Editar serviço"
                                    className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleHistorico(servico)} 
                                    title="Ver histórico"
                                    className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                  {servico.status_atendimento === 'executado' && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => { setDetalhesServicoId(servico.id); setDetalhesDialogOpen(true) }} 
                                      title="Ver detalhes da execução"
                                      className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      <Eye className="h-4 w-4 text-primary" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination controls */}
                  <div className="flex items-center justify-between mt-4 px-1">
                    <span className="text-sm text-muted-foreground">
                      Mostrando {totalFiltered === 0 ? 0 : startIndex + 1}{' - '}{Math.min(startIndex + pageSize, totalFiltered)} de {totalFiltered} serviços
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => setCurrentPage(safePage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {safePage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() => setCurrentPage(safePage + 1)}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agenda">
            {servicos ? (
              <AgendaSemanal servicos={servicos} onSelectServico={handleEdit} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            )}
          </TabsContent>

          <TabsContent value="prazos">
            {servicos ? (
              <PainelUrgencias servicos={servicos} onEditServico={handleEdit} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ImportarPlanilhaDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <NovoServicoNacionalGasDialog
        open={novoDialogOpen}
        onOpenChange={setNovoDialogOpen}
      />

      {selectedServico && (
        <>
          <ServicoNacionalGasDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            servico={selectedServico}
          />
          <ServicoHistoricoDialog
            open={historicoDialogOpen}
            onOpenChange={setHistoricoDialogOpen}
            servicoId={selectedServico.id}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} serviço(s)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DetalhesExecucaoDialog
        open={detalhesDialogOpen}
        onOpenChange={setDetalhesDialogOpen}
        servicoId={detalhesServicoId}
      />
    </Layout>
  )
}
