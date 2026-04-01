import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin, User, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ServicoExecucaoDialog from '@/components/servicos/ServicoExecucaoDialog'

interface Servico {
  id: string
  tipo_servico: string
  data_agendamento: string
  hora_agendamento: string | null
  status: string
  observacoes: string | null
  tipo?: string
  nome_cliente?: string
  endereco_servico?: string
  cliente: {
    nome: string
    identificacao_unidade: string
  }
  empreendimento: {
    nome: string
    endereco: string
  }
}

export default function ColetorServicos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [execucaoDialog, setExecucaoDialog] = useState<{
    open: boolean
    servicoId: string
    tipoServico: string
  }>({
    open: false,
    servicoId: '',
    tipoServico: ''
  })

  useEffect(() => {
    fetchOperadorId()
  }, [user])

  useEffect(() => {
    fetchServicos()
  }, [])

  const fetchOperadorId = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      setOperadorId(data?.id || null)
    } catch (error) {
      console.error('Erro ao buscar operador:', error)
      toast({
        title: "Erro",
        description: "Não foi possível identificar o operador",
        variant: "destructive"
      })
    }
  }

  const fetchServicos = async () => {
    try {
      setLoading(true)

      // Buscar serviços internos
      const { data: servicosInternos, error: errorInternos } = await supabase
        .from('servicos')
        .select(`
          id,
          tipo_servico,
          data_agendamento,
          hora_agendamento,
          status,
          observacoes,
          clientes!inner(
            nome,
            identificacao_unidade
          ),
          empreendimentos!inner(
            nome,
            endereco
          )
        `)
        .in('status', ['agendado', 'em_andamento'])
        .order('data_agendamento', { ascending: true })

      // Buscar serviços externos
      const { data: servicosExternos, error: errorExternos } = await supabase
        .from('servicos_externos')
        .select('*')
        .in('status', ['agendado', 'em_andamento'])
        .order('data_agendamento', { ascending: true })

      if (errorInternos) throw errorInternos
      if (errorExternos) throw errorExternos

      // Formatar serviços internos
      const servicosInternosFormatados = servicosInternos?.map(servico => ({
        id: servico.id,
        tipo_servico: servico.tipo_servico,
        data_agendamento: servico.data_agendamento,
        hora_agendamento: servico.hora_agendamento,
        status: servico.status,
        observacoes: servico.observacoes,
        tipo: 'interno',
        cliente: {
          nome: servico.clientes.nome,
          identificacao_unidade: servico.clientes.identificacao_unidade
        },
        empreendimento: {
          nome: servico.empreendimentos.nome,
          endereco: servico.empreendimentos.endereco
        }
      })) || []

      // Formatar serviços externos
      const servicosExternosFormatados = servicosExternos?.map(servico => ({
        id: servico.id,
        tipo_servico: servico.tipo_servico,
        data_agendamento: servico.data_agendamento,
        hora_agendamento: servico.hora_agendamento,
        status: servico.status,
        observacoes: servico.observacoes,
        tipo: 'externo',
        nome_cliente: servico.nome_cliente,
        endereco_servico: servico.endereco_servico,
        cliente: {
          nome: servico.nome_cliente,
          identificacao_unidade: 'Cliente Externo'
        },
        empreendimento: {
          nome: 'Serviço Externo',
          endereco: servico.endereco_servico
        }
      })) || []

      // Combinar e ordenar todos os serviços
      const todosServicos = [...servicosInternosFormatados, ...servicosExternosFormatados]
      todosServicos.sort((a, b) => {
        const dateA = new Date(`${a.data_agendamento}T${a.hora_agendamento || '00:00'}`)
        const dateB = new Date(`${b.data_agendamento}T${b.hora_agendamento || '00:00'}`)
        return dateA.getTime() - dateB.getTime()
      })

      setServicos(todosServicos)
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateServicoStatus = async (servicoId: string, novoStatus: string, isExterno: boolean = false) => {
    try {
      const updateData: any = { status: novoStatus }
      
      // Se está iniciando o serviço, captura o horário de início automaticamente
      if (novoStatus === 'em_andamento') {
        updateData.hora_inicio = new Date().toTimeString().slice(0, 8) // HH:MM:SS
      }

      const tableName = isExterno ? 'servicos_externos' : 'servicos'
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', servicoId)

      if (error) throw error

      toast({
        title: "Status atualizado",
        description: `Serviço marcado como ${novoStatus === 'em_andamento' ? 'em andamento' : 'concluído'}`,
      })

      fetchServicos()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendado':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Agendado</Badge>
      case 'em_andamento':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Em Andamento</Badge>
      case 'concluido':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Concluído</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!operadorId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Operador não encontrado</h2>
            <p className="text-gray-600 mb-4">Não foi possível identificar o operador logado.</p>
            <Button onClick={() => navigate('/coletor')}>
              Voltar ao Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/coletor')}
              className="text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Serviços Agendados</h1>
              <p className="text-sm text-gray-600">
                Todos os serviços agendados
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && servicos.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum serviço agendado
              </h3>
              <p className="text-gray-600">
                Você não possui serviços agendados no momento.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Serviços List */}
        {!loading && servicos.length > 0 && (
          <div className="space-y-4">
            {servicos.map((servico) => (
              <Card key={servico.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {servico.tipo_servico}
                        {servico.tipo === 'externo' && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                            Externo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <User className="w-4 h-4 mr-1" />
                        {servico.cliente.nome} - {servico.cliente.identificacao_unidade}
                      </CardDescription>
                    </div>
                    {getStatusBadge(servico.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Data e Hora */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{format(new Date(servico.data_agendamento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    {servico.hora_agendamento && (
                      <>
                        <Clock className="w-4 h-4 ml-4 mr-2" />
                        <span>{servico.hora_agendamento}</span>
                      </>
                    )}
                  </div>

                  {/* Localização */}
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{servico.empreendimento.nome}</div>
                      <div>{servico.empreendimento.endereco}</div>
                    </div>
                  </div>

                  {/* Observações */}
                  {servico.observacoes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <strong>Observações:</strong> {servico.observacoes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    {servico.status === 'agendado' && (
                      <Button
                        size="sm"
                        onClick={() => updateServicoStatus(servico.id, 'em_andamento', servico.tipo === 'externo')}
                        className="flex-1"
                      >
                        Iniciar Serviço
                      </Button>
                    )}
                    {servico.status === 'em_andamento' && (
                      <Button
                        size="sm"
                        onClick={() => setExecucaoDialog({
                          open: true,
                          servicoId: servico.id,
                          tipoServico: servico.tipo_servico
                        })}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Concluir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Execução do Serviço */}
        <ServicoExecucaoDialog
          open={execucaoDialog.open}
          onOpenChange={(open) => setExecucaoDialog(prev => ({ ...prev, open }))}
          servicoId={execucaoDialog.servicoId}
          tipoServico={execucaoDialog.tipoServico}
          onSuccess={fetchServicos}
        />
      </div>
    </div>
  )
}