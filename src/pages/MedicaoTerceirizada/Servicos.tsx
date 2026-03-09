import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Search, FileText, History, Pencil, AlertTriangle, Trash2, CalendarDays, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
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
  created_at: string
  empreendimento?: { nome: string } | null
  tecnico?: { nome: string } | null
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  executado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  executado: 'Executado',
  cancelado: 'Cancelado'
}

export default function ServicosNacionalGas() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [novoDialogOpen, setNovoDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<ServicoNacionalGas | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [ufFilter, setUfFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
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

  const tiposServico = servicos 
    ? [...new Set(servicos.map(s => s.tipo_servico))].filter(Boolean).sort()
    : []

  const filteredServicos = servicos?.filter(servico => {
    const matchesSearch = 
      servico.condominio_nome_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.morador_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.apartamento?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesUf = ufFilter === 'all' || servico.uf === ufFilter
    const matchesStatus = statusFilter === 'all' || servico.status_atendimento === statusFilter
    const matchesTipo = tipoFilter === 'all' || servico.tipo_servico === tipoFilter
    
    return matchesSearch && matchesUf && matchesStatus && matchesTipo
  })

  // Reset page when filters change
  const totalFiltered = filteredServicos?.length || 0
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  if (safePage !== currentPage) setCurrentPage(safePage)

  const startIndex = (safePage - 1) * pageSize
  const paginatedServicos = filteredServicos?.slice(startIndex, startIndex + pageSize)

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
        {/* Alerta de serviços não associados */}
        {servicosNaoAssociados > 0 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-400">
                <strong>{servicosNaoAssociados}</strong> serviço(s) não foram associados a nenhum empreendimento cadastrado.
              </span>
            </CardContent>
          </Card>
        )}

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
                        placeholder="Buscar por condomínio, morador ou apartamento..."
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
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={filteredServicos && filteredServicos.length > 0 && selectedIds.size === filteredServicos.length}
                              onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                            />
                          </TableHead>
                          <TableHead>Solicitação</TableHead>
                          <TableHead>Condomínio</TableHead>
                          <TableHead>Bloco/Apto</TableHead>
                          <TableHead>Morador</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>UF</TableHead>
                          <TableHead>Agendamento</TableHead>
                          <TableHead>Técnico</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedServicos?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                              Nenhum serviço encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedServicos?.map((servico) => (
                            <TableRow key={servico.id} className={!servico.empreendimento_id ? 'bg-yellow-50/50 dark:bg-yellow-900/5' : ''}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(servico.id)}
                                  onCheckedChange={(checked) => toggleSelectOne(servico.id, !!checked)}
                                />
                              </TableCell>
                              <TableCell>
                                {servico.data_solicitacao
                                  ? format(new Date(servico.data_solicitacao + 'T00:00:00'), 'dd/MM/yyyy')
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{servico.condominio_nome_original}</span>
                                  {servico.empreendimento ? (
                                    <span className="text-xs text-green-600">✓ Vinculado</span>
                                  ) : (
                                    <span className="text-xs text-yellow-600">⚠ Não vinculado</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {servico.bloco && <span>Bloco {servico.bloco}</span>}
                                {servico.bloco && servico.apartamento && ' - '}
                                {servico.apartamento && <span>Apto {servico.apartamento}</span>}
                              </TableCell>
                              <TableCell>{servico.morador_nome || '-'}</TableCell>
                              <TableCell>{servico.tipo_servico?.toUpperCase()}</TableCell>
                              <TableCell>{servico.uf}</TableCell>
                              <TableCell>
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
                              <TableCell>{servico.tecnico?.nome || '-'}</TableCell>
                              <TableCell>
                                <Badge className={statusColors[servico.status_atendimento]}>
                                  {statusLabels[servico.status_atendimento]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(servico)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleHistorico(servico)}>
                                    <History className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination controls */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-muted-foreground">
                      Mostrando {totalFiltered === 0 ? 0 : startIndex + 1}{' - '}{Math.min(startIndex + pageSize, totalFiltered)} de {totalFiltered} registros
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
    </Layout>
  )
}
