import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Building2, Users, FileText, LogOut, Download, Eye, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface EmpreendimentoData {
  id: string
  nome: string
  endereco: string
  email: string
  cnpj: string
  tipo_gas: string
  preco_kg_gas?: number
  preco_m3_gas?: number
}

interface Leitura {
  id: string
  leitura_atual: number
  data_leitura: string
  observacao?: string
  tipo_observacao?: string
  foto_url?: string
  status_sincronizacao: string
  cliente_id: string
  consumo?: number
  valor_fatura?: number
  clientes?: {
    identificacao_unidade: string
    nome?: string
  }
  operadores?: {
    nome: string
  }
}

export default function AreaCliente() {
  const [empreendimento, setEmpreendimento] = useState<EmpreendimentoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [leituras, setLeituras] = useState<Leitura[]>([])
  const [selectedMes, setSelectedMes] = useState<string>('')
  const [selectedAno, setSelectedAno] = useState<string>('')
  const [loadingLeituras, setLoadingLeituras] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  // Gerar lista de meses
  const meses = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ]

  // Gerar lista de anos (últimos 5 anos e próximos 2)
  const currentYear = new Date().getFullYear()
  const anos = Array.from({ length: 8 }, (_, i) => {
    const year = currentYear - 5 + i
    return { value: year.toString(), label: year.toString() }
  })

  useEffect(() => {
    if (user) {
      fetchEmpreendimentoData()
    }
  }, [user])

  useEffect(() => {
    if (empreendimento) {
      // Definir mês e ano atual como padrão
      const currentDate = new Date()
      setSelectedMes(String(currentDate.getMonth() + 1).padStart(2, '0'))
      setSelectedAno(currentDate.getFullYear().toString())
    }
  }, [empreendimento])

  useEffect(() => {
    if (empreendimento && selectedMes && selectedAno) {
      fetchLeituras()
    }
  }, [empreendimento, selectedMes, selectedAno])

  const fetchEmpreendimentoData = async () => {
    try {
      // First, get the empreendimento_id from empreendimento_users table
      const { data: linkData, error: linkError } = await supabase
        .from('empreendimento_users')
        .select('empreendimento_id')
        .eq('user_id', user?.id)
        .single()

      if (linkError) {
        throw new Error('Usuário não vinculado a nenhum empreendimento')
      }

      // Then get the empreendimento data
      const { data: empData, error: empError } = await supabase
        .from('empreendimentos')
        .select('*')
        .eq('id', linkData.empreendimento_id)
        .single()

      if (empError) throw empError

      setEmpreendimento(empData)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLeituras = async () => {
    if (!selectedMes || !selectedAno) return
    
    setLoadingLeituras(true)
    try {
      const startDate = new Date(parseInt(selectedAno), parseInt(selectedMes) - 1, 1)
      const endDate = new Date(parseInt(selectedAno), parseInt(selectedMes), 0, 23, 59, 59)

      const { data, error } = await supabase
        .from('leituras')
        .select(`
          *,
          clientes!inner(identificacao_unidade, nome, empreendimento_id),
          operadores(nome)
        `)
        .eq('clientes.empreendimento_id', empreendimento?.id)
        .gte('data_leitura', startDate.toISOString())
        .lte('data_leitura', endDate.toISOString())
        .order('data_leitura', { ascending: false })

      if (error) throw error

      // Calcular consumo e valor da fatura para cada leitura
      const leiturasComConsumo = await Promise.all((data || []).map(async (leitura) => {
        // Buscar leitura anterior do mesmo cliente
        const { data: leituraAnterior } = await supabase
          .from('leituras')
          .select('leitura_atual')
          .eq('cliente_id', leitura.cliente_id)
          .lt('data_leitura', leitura.data_leitura)
          .order('data_leitura', { ascending: false })
          .limit(1)

        // Buscar dados do cliente para obter leitura inicial
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('leitura_inicial')
          .eq('id', leitura.cliente_id)
          .single()

        let consumo = 0
        let valorFatura = 0
        let leituraAnteriorValor = 0

        if (leituraAnterior && leituraAnterior.length > 0) {
          leituraAnteriorValor = leituraAnterior[0].leitura_atual
        } else if (clienteData?.leitura_inicial !== undefined) {
          // Primeira leitura: usar leitura inicial do cliente
          leituraAnteriorValor = clienteData.leitura_inicial
        }

        consumo = leitura.leitura_atual - leituraAnteriorValor
        
        // Calcular valor da fatura baseado no tipo de gás
        if (consumo > 0) {
          if (empreendimento?.tipo_gas === 'GLP' && empreendimento.preco_kg_gas) {
            valorFatura = consumo * empreendimento.preco_kg_gas
          } else if (empreendimento?.tipo_gas === 'GN' && empreendimento.preco_m3_gas) {
            valorFatura = consumo * empreendimento.preco_m3_gas
          }
        }

        return {
          ...leitura,
          consumo,
          valor_fatura: valorFatura
        }
      }))

      setLeituras(leiturasComConsumo)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar leituras",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingLeituras(false)
    }
  }

  const exportToPDF = () => {
    console.log('Iniciando exportação do PDF...')
    
    if (!leituras.length) {
      console.log('Nenhuma leitura encontrada')
      toast({
        title: "Erro",
        description: "Nenhuma leitura encontrada para exportar.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Criando documento PDF...')
      const competenciaLabel = `${meses.find(m => m.value === selectedMes)?.label}/${selectedAno}`
      const doc = new jsPDF()
      
      console.log('Adicionando cabeçalho...')
      // Cabeçalho simples
      doc.setFontSize(16)
      doc.text('RELATÓRIO DE LEITURAS', 20, 20)
      doc.setFontSize(12)
      doc.text(`${empreendimento?.nome || 'N/A'}`, 20, 30)
      doc.text(`Competência: ${competenciaLabel}`, 20, 40)
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 50)

      console.log('Preparando dados da tabela...')
      // Dados simples da tabela
      const tableData = leituras.map((leitura, index) => {
        console.log(`Processando leitura ${index + 1}/${leituras.length}`)
        const leituraAnteriorValor = leitura.leitura_atual - (leitura.consumo || 0)
        
        return [
          format(new Date(leitura.data_leitura), 'dd/MM/yyyy', { locale: ptBR }),
          leitura.clientes?.identificacao_unidade || 'N/A',
          leituraAnteriorValor.toFixed(2),
          leitura.leitura_atual.toFixed(2),
          (leitura.consumo || 0).toFixed(2),
          `R$ ${(leitura.valor_fatura || 0).toFixed(2)}`
        ]
      })

      console.log('Gerando tabela...')
      // Versão simples da tabela
      autoTable(doc, {
        head: [['Data', 'Unidade', 'Anterior', 'Atual', 'Consumo', 'Valor']],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 8
        }
      })

      console.log('Salvando arquivo...')
      const fileName = `relatorio-${selectedMes}-${selectedAno}.pdf`
      doc.save(fileName)
      
      console.log('PDF gerado com sucesso!')
      toast({
        title: "PDF gerado!",
        description: "O relatório foi baixado com sucesso.",
      })
      
    } catch (error: any) {
      console.error('ERRO ao gerar PDF:', error)
      console.error('Stack trace:', error.stack)
      toast({
        title: "Erro ao gerar PDF",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sincronizado':
        return <Badge variant="default" className="bg-green-500">Sincronizado</Badge>
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getObservacaoBadge = (observacao?: string, tipo?: string) => {
    if (!observacao) return null
    
    const variant = tipo === 'problema' ? 'destructive' : 'secondary'
    return <Badge variant={variant}>{observacao}</Badge>
  }

  const openLightbox = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setLightboxOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/empreendimento/login" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!empreendimento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Empreendimento não encontrado</h2>
              <p className="text-muted-foreground mb-4">
                Não foi possível localizar os dados do seu empreendimento.
              </p>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{empreendimento.nome}</h1>
              <p className="text-sm text-muted-foreground">Área do Cliente</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Informações do Empreendimento */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Informações do Empreendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nome</Label>
                <p className="text-lg">{empreendimento.nome}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Endereço</Label>
                <p>{empreendimento.endereco}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p>{empreendimento.email}</p>
              </div>
              {empreendimento.tipo_gas && (
                <div>
                  <Label className="text-sm font-medium">Tipo de Gás</Label>
                  <p>{empreendimento.tipo_gas}</p>
                </div>
              )}
              {empreendimento.preco_kg_gas && (
                <div>
                  <Label className="text-sm font-medium">Preço do Gás por Kg</Label>
                  <p>R$ {empreendimento.preco_kg_gas.toFixed(2)}</p>
                </div>
              )}
              {empreendimento.preco_m3_gas && (
                <div>
                  <Label className="text-sm font-medium">Preço do Gás por m³</Label>
                  <p>R$ {empreendimento.preco_m3_gas.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu de Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Unidades
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Leituras do Empreendimento */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Leituras do Empreendimento
              </div>
              {leituras.length > 0 && (
                <Button onClick={exportToPDF} size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Visualize as leituras coletadas por competência
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros por Mês e Ano */}
            <div className="mb-6 flex gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Mês</Label>
                <Select value={selectedMes} onValueChange={setSelectedMes}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map(mes => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Ano</Label>
                <Select value={selectedAno} onValueChange={setSelectedAno}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map(ano => (
                      <SelectItem key={ano.value} value={ano.value}>
                        {ano.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabela de Leituras */}
            {loadingLeituras ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : leituras.length > 0 ? (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Leitura</TableHead>
                      <TableHead>Consumo</TableHead>
                      <TableHead>Valor Fatura</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leituras.map((leitura) => (
                      <TableRow key={leitura.id}>
                        <TableCell className="font-medium">
                          {leitura.clientes?.identificacao_unidade}
                        </TableCell>
                        <TableCell>{leitura.clientes?.nome}</TableCell>
                        <TableCell>{leitura.leitura_atual}</TableCell>
                        <TableCell>
                          <span className={leitura.consumo && leitura.consumo > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {leitura.consumo ? leitura.consumo.toFixed(2) : '0.00'} {empreendimento?.tipo_gas === 'GLP' ? 'kg' : 'm³'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={leitura.valor_fatura && leitura.valor_fatura > 0 ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                            {formatCurrency(leitura.valor_fatura || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(leitura.data_leitura), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {getObservacaoBadge(leitura.observacao, leitura.tipo_observacao)}
                        </TableCell>
                        <TableCell>{leitura.operadores?.nome}</TableCell>
                        <TableCell>
                          {getStatusBadge(leitura.status_sincronizacao)}
                        </TableCell>
                        <TableCell>
                          {leitura.foto_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLightbox(leitura.foto_url!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : selectedMes && selectedAno ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma leitura encontrada</h3>
                <p className="text-muted-foreground">
                  Não há leituras registradas para {meses.find(m => m.value === selectedMes)?.label}/{selectedAno}.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione mês e ano</h3>
                <p className="text-muted-foreground">
                  Escolha o mês e ano para visualizar as leituras.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lightbox para fotos */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <DialogHeader className="sr-only">
              <DialogTitle>Foto do Medidor</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              {selectedImageUrl && (
                <img
                  src={selectedImageUrl}
                  alt="Foto do medidor"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props}>
      {children}
    </label>
  )
}