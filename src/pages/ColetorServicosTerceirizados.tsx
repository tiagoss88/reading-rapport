import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Building2, Calendar, Clock, CheckCircle, Loader2, AlertCircle, Phone, Mail, ChevronRight, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ExecucaoServicoTerceirizado from '@/components/medicao-terceirizada/ExecucaoServicoTerceirizado'

interface ServicoTerceirizado {
  id: string
  numero_protocolo: string | null
  condominio_nome_original: string
  bloco: string | null
  apartamento: string | null
  morador_nome: string | null
  telefone: string | null
  email: string | null
  tipo_servico: string
  uf: string | null
  data_agendamento: string | null
  turno: string | null
  status_atendimento: string
  observacao: string | null
  empreendimento?: {
    nome: string
    endereco: string
  } | null
}

export default function ColetorServicosTerceirizados() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [servicos, setServicos] = useState<ServicoTerceirizado[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUF, setSelectedUF] = useState<'todos' | 'BA' | 'CE'>('todos')
  const [operadorId, setOperadorId] = useState<string | null>(null)
  
  const [selectedServico, setSelectedServico] = useState<ServicoTerceirizado | null>(null)
  const [showExecucao, setShowExecucao] = useState(false)

  useEffect(() => {
    if (user) {
      fetchOperadorId()
    }
  }, [user])

  useEffect(() => {
    if (operadorId) {
      fetchServicos()
    }
  }, [operadorId])

  const fetchOperadorId = async () => {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setOperadorId(data.id)
    } catch (error) {
      console.error('Erro ao buscar operador:', error)
      setLoading(false)
    }
  }

  const fetchServicos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select(`
          id,
          condominio_nome_original,
          bloco,
          apartamento,
          morador_nome,
          telefone,
          email,
          tipo_servico,
          uf,
          data_agendamento,
          turno,
          status_atendimento,
          observacao,
          empreendimento:empreendimentos_terceirizados(nome, endereco)
        `)
        .in('status_atendimento', ['pendente', 'agendado'])
        .order('data_agendamento', { ascending: true, nullsFirst: false })

      if (error) throw error
      setServicos(data || [])
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
      toast({
        title: 'Erro ao carregar serviços',
        description: 'Não foi possível carregar os serviços agendados.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>
      case 'agendado':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Agendado</Badge>
      case 'executado':
        return <Badge className="bg-green-500 hover:bg-green-600">Executado</Badge>
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTurnoLabel = (turno: string | null) => {
    switch (turno) {
      case 'manha':
        return 'Manhã'
      case 'tarde':
        return 'Tarde'
      default:
        return turno || '-'
    }
  }

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false)
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ title: 'Copiado!', description: text })
      setTimeout(() => setCopied(false), 2000)
    }
    return (
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </Button>
    )
  }

  // Show execution screen
  if (showExecucao && selectedServico && operadorId) {
    return (
      <ExecucaoServicoTerceirizado
        servico={selectedServico}
        operadorId={operadorId}
        onSuccess={() => {
          setShowExecucao(false)
          setSelectedServico(null)
          fetchServicos()
        }}
        onCancel={() => setShowExecucao(false)}
      />
    )
  }


  if (!operadorId && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <p>Operador não encontrado. Faça login novamente.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Detail view
  if (selectedServico) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedServico(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Detalhes do Serviço</h1>
            </div>
            {getStatusBadge(selectedServico.status_atendimento)}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                {selectedServico.tipo_servico.toUpperCase()}
                {selectedServico.numero_protocolo && (
                  <span className="text-xs font-mono text-muted-foreground">({selectedServico.numero_protocolo})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Condomínio */}
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Condomínio</p>
                  <p className="font-medium">{selectedServico.condominio_nome_original}</p>
                </div>
                <CopyButton text={selectedServico.condominio_nome_original} />
              </div>

              {/* Bloco / APT */}
              {(selectedServico.bloco || selectedServico.apartamento) && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Bloco / APT</p>
                    <p className="font-medium">
                      {selectedServico.bloco && `Bloco ${selectedServico.bloco}`}
                      {selectedServico.bloco && selectedServico.apartamento && ' - '}
                      {selectedServico.apartamento && `Apto ${selectedServico.apartamento}`}
                    </p>
                  </div>
                  <CopyButton text={`${selectedServico.bloco ? `Bloco ${selectedServico.bloco}` : ''}${selectedServico.bloco && selectedServico.apartamento ? ' - ' : ''}${selectedServico.apartamento ? `Apto ${selectedServico.apartamento}` : ''}`} />
                </div>
              )}

              {/* Morador */}
              {selectedServico.morador_nome && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Morador</p>
                    <p className="font-medium">{selectedServico.morador_nome}</p>
                  </div>
                  <CopyButton text={selectedServico.morador_nome} />
                </div>
              )}

              {/* Telefone */}
              {selectedServico.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <a href={`tel:${selectedServico.telefone}`} className="font-medium text-primary">
                      {selectedServico.telefone}
                    </a>
                  </div>
                  <CopyButton text={selectedServico.telefone} />
                </div>
              )}

              {/* Email */}
              {selectedServico.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{selectedServico.email}</p>
                  </div>
                  <CopyButton text={selectedServico.email} />
                </div>
              )}

              {/* Data e Turno */}
              {selectedServico.data_agendamento && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Agendamento</p>
                    <p className="font-medium">
                      {format(new Date(selectedServico.data_agendamento + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                      {selectedServico.turno && ` - ${getTurnoLabel(selectedServico.turno)}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Observação */}
              {selectedServico.observacao && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Observação</p>
                  <div className="flex items-start gap-2">
                    <p className="text-sm bg-muted p-3 rounded-md flex-1">{selectedServico.observacao}</p>
                    <CopyButton text={selectedServico.observacao} />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={() => setShowExecucao(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Iniciar Atividade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/coletor')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Serviços Terceirizados</h1>
            <p className="text-sm text-gray-600">
              Todos os serviços da Nacional Gás
            </p>
          </div>
        </div>

        {/* UF Filter */}
        <div className="flex gap-2">
          {(['todos', 'BA', 'CE'] as const).map((uf) => (
            <Button
              key={uf}
              variant={selectedUF === uf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedUF(uf)}
              className="flex-1"
            >
              {uf === 'todos' ? 'Todos' : uf}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && servicos.filter(s => selectedUF === 'todos' || s.uf === selectedUF).length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum serviço agendado</p>
                <p className="text-sm mt-1">
                  Você não tem serviços terceirizados pendentes no momento.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services List */}
        {!loading && servicos.filter(s => selectedUF === 'todos' || s.uf === selectedUF).map((servico) => (
          <Card
            key={servico.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedServico(servico)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-primary truncate">
                      {servico.tipo_servico.toUpperCase()}
                    </p>
                    {getStatusBadge(servico.status_atendimento)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {servico.condominio_nome_original}
                    {(servico.bloco || servico.apartamento) && ' - '}
                    {servico.bloco && `Bloco ${servico.bloco}`}
                    {servico.bloco && servico.apartamento && ', '}
                    {servico.apartamento && `Apto ${servico.apartamento}`}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
