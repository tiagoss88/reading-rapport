import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, FileText, LogOut, Download, Eye } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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
  const [competencias, setCompetencias] = useState<string[]>([])
  const [selectedCompetencia, setSelectedCompetencia] = useState<string>('')
  const [loadingLeituras, setLoadingLeituras] = useState(false)
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchEmpreendimentoData()
    }
  }, [user])

  useEffect(() => {
    if (empreendimento) {
      fetchCompetencias()
    }
  }, [empreendimento])

  useEffect(() => {
    if (empreendimento && selectedCompetencia) {
      fetchLeituras()
    }
  }, [empreendimento, selectedCompetencia])

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

  const fetchCompetencias = async () => {
    try {
      const { data, error } = await supabase
        .from('leituras')
        .select('data_leitura, clientes!inner(empreendimento_id)')
        .eq('clientes.empreendimento_id', empreendimento?.id)
        .order('data_leitura', { ascending: false })

      if (error) throw error

      // Extract unique month/year combinations
      const uniqueCompetencias = new Set<string>()
      data?.forEach(leitura => {
        const date = new Date(leitura.data_leitura)
        const competencia = format(date, 'MM/yyyy', { locale: ptBR })
        uniqueCompetencias.add(competencia)
      })

      const sortedCompetencias = Array.from(uniqueCompetencias).sort((a, b) => {
        const [monthA, yearA] = a.split('/')
        const [monthB, yearB] = b.split('/')
        const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1)
        const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1)
        return dateB.getTime() - dateA.getTime()
      })

      setCompetencias(sortedCompetencias)
      if (sortedCompetencias.length > 0) {
        setSelectedCompetencia(sortedCompetencias[0])
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar competências",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fetchLeituras = async () => {
    if (!selectedCompetencia) return
    
    setLoadingLeituras(true)
    try {
      const [month, year] = selectedCompetencia.split('/')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

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

      setLeituras(data || [])
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
    if (!leituras.length) return

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(16)
    doc.text(`Relatório de Leituras - ${empreendimento?.nome}`, 20, 20)
    doc.setFontSize(12)
    doc.text(`Competência: ${selectedCompetencia}`, 20, 30)
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 40)

    // Table data
    const tableData = leituras.map(leitura => [
      leitura.clientes?.identificacao_unidade || '',
      leitura.clientes?.nome || '',
      leitura.leitura_atual.toString(),
      format(new Date(leitura.data_leitura), 'dd/MM/yyyy', { locale: ptBR }),
      leitura.observacao || '',
      leitura.operadores?.nome || '',
      leitura.status_sincronizacao
    ])

    // Generate table
    ;(doc as any).autoTable({
      head: [['Unidade', 'Nome', 'Leitura', 'Data', 'Observação', 'Operador', 'Status']],
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: 255
      }
    })

    doc.save(`leituras-${empreendimento?.nome}-${selectedCompetencia.replace('/', '-')}.pdf`)
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
            {/* Filtro por Competência */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">Competência</Label>
              <Select value={selectedCompetencia} onValueChange={setSelectedCompetencia}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {competencias.map(competencia => (
                    <SelectItem key={competencia} value={competencia}>
                      {competencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                              onClick={() => window.open(leitura.foto_url, '_blank')}
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
            ) : selectedCompetencia ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma leitura encontrada</h3>
                <p className="text-muted-foreground">
                  Não há leituras registradas para a competência {selectedCompetencia}.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma competência</h3>
                <p className="text-muted-foreground">
                  Escolha uma competência para visualizar as leituras.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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