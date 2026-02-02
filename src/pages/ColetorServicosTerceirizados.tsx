import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Building2, Calendar, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ServicoTerceirizado {
  id: string
  condominio_nome_original: string
  bloco: string | null
  apartamento: string | null
  morador_nome: string | null
  tipo_servico: string
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
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
          tipo_servico,
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

  const updateStatus = async (servicoId: string, novoStatus: string) => {
    try {
      setUpdatingId(servicoId)
      const { error } = await supabase
        .from('servicos_nacional_gas')
        .update({ status_atendimento: novoStatus })
        .eq('id', servicoId)

      if (error) throw error

      toast({
        title: 'Status atualizado',
        description: `Serviço marcado como ${novoStatus === 'executado' ? 'executado' : novoStatus}.`
      })

      fetchServicos()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status do serviço.',
        variant: 'destructive'
      })
    } finally {
      setUpdatingId(null)
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

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && servicos.length === 0 && (
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
        {!loading && servicos.map((servico) => (
          <Card key={servico.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold text-primary">
                  {servico.tipo_servico.toUpperCase()}
                </CardTitle>
                {getStatusBadge(servico.status_atendimento)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Morador */}
              {servico.morador_nome && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{servico.morador_nome}</span>
                </div>
              )}

              {/* Local */}
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{servico.condominio_nome_original}</p>
                  {(servico.bloco || servico.apartamento) && (
                    <p className="text-gray-600">
                      {servico.bloco && `Bloco ${servico.bloco}`}
                      {servico.bloco && servico.apartamento && ' - '}
                      {servico.apartamento && `Apto ${servico.apartamento}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Data e Turno */}
              {servico.data_agendamento && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {format(new Date(servico.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {servico.turno && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{getTurnoLabel(servico.turno)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Observação */}
              {servico.observacao && (
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {servico.observacao}
                </p>
              )}

              {/* Actions */}
              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={() => updateStatus(servico.id, 'executado')}
                  disabled={updatingId === servico.id}
                >
                  {updatingId === servico.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Marcar como Executado
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
