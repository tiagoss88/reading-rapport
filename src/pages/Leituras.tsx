import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [novaLeituraOpen, setNovaLeituraOpen] = useState(false)
  const [fotoLightboxOpen, setFotoLightboxOpen] = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLeituras()
  }, [])

  const fetchLeituras = async () => {
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
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por unidade, empreendimento ou operador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
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
            </div>
          </CardContent>
        </Card>

        {/* Lista de Leituras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Lista de Leituras
            </CardTitle>
            <CardDescription>
              {filteredLeituras.length} de {leituras.length} leitura(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando leituras...</p>
              </div>
            ) : filteredLeituras.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {leituras.length === 0 ? 'Nenhuma leitura encontrada' : 'Nenhuma leitura corresponde aos filtros'}
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