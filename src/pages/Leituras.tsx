import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { FileText, Search, Download, Eye, Plus, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import NovaLeituraDialog from '@/components/leituras/NovaLeituraDialog'

interface Leitura {
  id: string
  leitura_atual: number
  data_leitura: string
  observacao?: string
  tipo_observacao?: string
  foto_url?: string
  status_sincronizacao: string
  created_at: string
  cliente_id: string
  operador_id: string
  clientes?: {
    identificacao_unidade: string
    empreendimentos?: {
      nome: string
    }
  }
  operadores?: {
    nome: string
  }
}

export default function Leituras() {
  const [leituras, setLeituras] = useState<Leitura[]>([])
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [empreendimentoFilter, setEmpreendimentoFilter] = useState('')
  const [clienteFilter, setClienteFilter] = useState('')
  const [empreendimentoOpen, setEmpreendimentoOpen] = useState(false)
  const [clienteOpen, setClienteOpen] = useState(false)
  const [novaLeituraOpen, setNovaLeituraOpen] = useState(false)
  const [fotoLightboxOpen, setFotoLightboxOpen] = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchEmpreendimentos()
  }, [])

  // Buscar clientes quando empreendimento for selecionado
  useEffect(() => {
    if (empreendimentoFilter) {
      fetchClientes()
    } else {
      setClientes([])
      setClienteFilter('')
    }
  }, [empreendimentoFilter])

  const fetchEmpreendimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .order('nome')

      if (error) throw error
      setEmpreendimentos(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empreendimentos",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fetchClientes = async () => {
    if (!empreendimentoFilter) return

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          id,
          identificacao_unidade,
          nome,
          empreendimentos:empreendimento_id (nome)
        `)
        .eq('status', 'ativo')
        .eq('empreendimento_id', empreendimentoFilter)
        .order('identificacao_unidade')

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fetchLeituras = async () => {
    if (!clienteFilter) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leituras')
        .select(`
          *,
          clientes:cliente_id (
            identificacao_unidade,
            empreendimentos:empreendimento_id (nome)
          ),
          operadores:operador_id (nome)
        `)
        .eq('cliente_id', clienteFilter)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeituras(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar leituras",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Buscar leituras quando cliente for selecionado
  useEffect(() => {
    if (clienteFilter) {
      fetchLeituras()
    } else {
      setLeituras([])
    }
  }, [clienteFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sincronizado':
        return <Badge variant="default">Sincronizado</Badge>
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getObservacaoBadge = (tipo: string) => {
    switch (tipo) {
      case 'impedimento':
        return <Badge variant="destructive">Impedimento</Badge>
      case 'irregularidade':
        return <Badge variant="secondary">Irregularidade</Badge>
      case 'observacao':
        return <Badge variant="outline">Observação</Badge>
      default:
        return null
    }
  }

  const filteredLeituras = leituras.filter(leitura => {
    const matchesSearch = 
      leitura.clientes?.identificacao_unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leitura.clientes?.empreendimentos?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leitura.operadores?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || leitura.status_sincronizacao === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const exportToCSV = () => {
    const headers = ['Data', 'Empreendimento', 'Unidade', 'Leitura', 'Operador', 'Status', 'Observação']
    const rows = filteredLeituras.map(leitura => [
      format(new Date(leitura.data_leitura), 'dd/MM/yyyy HH:mm'),
      leitura.clientes?.empreendimentos?.nome || '',
      leitura.clientes?.identificacao_unidade || '',
      leitura.leitura_atual.toString(),
      leitura.operadores?.nome || '',
      leitura.status_sincronizacao,
      leitura.observacao || ''
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `leituras_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const abrirFotoLightbox = (fotoUrl: string) => {
    setFotoSelecionada(fotoUrl)
    setFotoLightboxOpen(true)
  }

  const fecharFotoLightbox = () => {
    setFotoLightboxOpen(false)
    setFotoSelecionada(null)
  }

  return (
    <Layout title="Leituras">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Leituras</h1>
            <p className="text-muted-foreground">Visualize e gerencie as leituras realizadas</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setNovaLeituraOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Leitura
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={filteredLeituras.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Primeiro selecione um empreendimento, depois uma unidade para visualizar as leituras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Seleção de Empreendimento */}
              <div className="flex-1">
                <Label htmlFor="empreendimento-filter" className="text-sm font-medium mb-2 block">
                  Empreendimento
                </Label>
                <Popover open={empreendimentoOpen} onOpenChange={setEmpreendimentoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={empreendimentoOpen}
                      className="w-full justify-between"
                    >
                      {empreendimentoFilter
                        ? empreendimentos.find((emp) => emp.id === empreendimentoFilter)?.nome || "Selecione um empreendimento"
                        : "Selecione um empreendimento"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Digite para buscar empreendimentos..." />
                      <CommandList>
                        <CommandEmpty>Nenhum empreendimento encontrado.</CommandEmpty>
                        <CommandGroup>
                          {empreendimentos.map((empreendimento) => (
                            <CommandItem
                              key={empreendimento.id}
                              value={empreendimento.nome}
                              onSelect={() => {
                                setEmpreendimentoFilter(empreendimento.id)
                                setEmpreendimentoOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  empreendimentoFilter === empreendimento.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {empreendimento.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Seleção de Cliente (apenas se empreendimento estiver selecionado) */}
              {empreendimentoFilter && (
                <div className="flex-1">
                  <Label htmlFor="cliente-filter" className="text-sm font-medium mb-2 block">
                    Unidade
                  </Label>
                  <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clienteOpen}
                        className="w-full justify-between"
                      >
                        {clienteFilter
                          ? clientes.find((cliente) => cliente.id === clienteFilter)
                              ? `${clientes.find((cliente) => cliente.id === clienteFilter)?.identificacao_unidade} - ${clientes.find((cliente) => cliente.id === clienteFilter)?.nome || 'Sem nome'}`
                              : "Selecione uma unidade"
                          : "Selecione uma unidade"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Digite para buscar unidades..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                          <CommandGroup>
                            {clientes.map((cliente) => (
                              <CommandItem
                                key={cliente.id}
                                value={`${cliente.identificacao_unidade} ${cliente.nome || ''}`}
                                onSelect={() => {
                                  setClienteFilter(cliente.id)
                                  setClienteOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    clienteFilter === cliente.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cliente.identificacao_unidade} - {cliente.nome || 'Sem nome'}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Filtro de Status */}
              <div className="w-full sm:w-48">
                <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="sincronizado">Sincronizado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Busca (apenas se cliente estiver selecionado) */}
              {clienteFilter && (
                <div className="flex-1">
                  <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                    Busca
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Pesquisar por operador ou observação..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Leituras */}
        {!clienteFilter ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um Empreendimento
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Primeiro escolha um empreendimento e depois uma unidade nos filtros acima para visualizar as leituras.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Lista de Leituras
              </CardTitle>
              <CardDescription>
                {filteredLeituras.length} de {leituras.length} leitura(s) encontrada(s)
                {clientes.find(c => c.id === clienteFilter) && 
                  ` para ${clientes.find(c => c.id === clienteFilter)?.identificacao_unidade}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando leituras...</p>
                </div>
              ) : filteredLeituras.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhuma leitura encontrada para este cliente
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Leitura</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Foto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeituras.map((leitura) => (
                      <TableRow key={leitura.id}>
                        <TableCell className="font-medium">
                          {format(new Date(leitura.data_leitura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {leitura.clientes?.empreendimentos?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {leitura.clientes?.identificacao_unidade || 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {leitura.leitura_atual.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {leitura.operadores?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(leitura.status_sincronizacao)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {leitura.tipo_observacao && getObservacaoBadge(leitura.tipo_observacao)}
                            {leitura.observacao && (
                              <p className="text-sm text-muted-foreground max-w-xs truncate">
                                {leitura.observacao}
                              </p>
                            )}
                          </div>
                        </TableCell>
                         <TableCell>
                           {leitura.foto_url ? (
                             <Button 
                               variant="ghost" 
                               size="icon"
                               onClick={() => abrirFotoLightbox(leitura.foto_url!)}
                               className="hover:bg-blue-100 hover:text-blue-600"
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                           ) : (
                             <span className="text-muted-foreground text-sm">-</span>
                           )}
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Lightbox para visualizar foto */}
      <Dialog open={fotoLightboxOpen} onOpenChange={setFotoLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none">
          <div className="relative">
            {/* Botão de fechar no canto superior esquerdo */}
            <Button
              variant="ghost"
              size="icon"
              onClick={fecharFotoLightbox}
              className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Imagem da foto */}
            {fotoSelecionada && (
              <div className="flex items-center justify-center min-h-[70vh]">
                <img
                  src={fotoSelecionada}
                  alt="Foto do medidor"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg'
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NovaLeituraDialog
        open={novaLeituraOpen}
        onOpenChange={setNovaLeituraOpen}
        onSuccess={fetchLeituras}
      />
    </div>
  </Layout>
)
}