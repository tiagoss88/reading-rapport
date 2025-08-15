import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, User, Wrench, FileText, Package, Camera, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ServicoDetalhesProps {
  servicoId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const tiposServicoLabels: { [key: string]: string } = {
  'religacao': 'Religação',
  'religacao_emergencial': 'Religação Emergencial',
  'bloqueio': 'Bloqueio (Pedido do Cliente)',
  'corte': 'Corte (Falta de Pagamento)',
  'visita_tecnica': 'Visita Técnica',
  'instalacao': 'Instalação',
  'cheiro_gas': 'Cheiro de Gás',
  'falta_gas': 'Falta de Gás'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'agendado':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'em_andamento':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'concluido':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'agendado':
      return 'Agendado'
    case 'em_andamento':
      return 'Em Andamento'
    case 'concluido':
      return 'Concluído'
    default:
      return status
  }
}

export default function ServicoDetalhesDialog({ servicoId, open, onOpenChange }: ServicoDetalhesProps) {
  const { toast } = useToast()
  const [servico, setServico] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!servicoId || !open) return

    const fetchServico = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('servicos')
          .select(`
            *,
            clientes (
              id,
              nome,
              identificacao_unidade,
              cpf
            ),
            empreendimentos (
              id,
              nome,
              endereco
            ),
            operadores:operador_responsavel_id (
              nome
            )
          `)
          .eq('id', servicoId)
          .single()

        if (error) {
          toast({
            title: "Erro ao carregar detalhes",
            description: error.message,
            variant: "destructive"
          })
        } else {
          setServico(data)
        }
      } catch (error) {
        toast({
          title: "Erro ao carregar detalhes",
          description: "Tente novamente",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchServico()
  }, [servicoId, open, toast])

  if (!open || !servicoId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Detalhes do Serviço
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Carregando detalhes...</p>
          </div>
        ) : servico ? (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                <Badge className={getStatusColor(servico.status)}>
                  {getStatusLabel(servico.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Serviço</label>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span>{tiposServicoLabels[servico.tipo_servico] || servico.tipo_servico}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Data Agendamento</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(servico.data_agendamento).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cliente e Local */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Cliente e Local</h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{servico.clientes?.nome} - Unidade {servico.clientes?.identificacao_unidade}</span>
                  </div>
                  {servico.clientes?.cpf && (
                    <p className="text-sm text-muted-foreground ml-6">CPF: {servico.clientes.cpf}</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Empreendimento</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{servico.empreendimentos?.nome}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{servico.empreendimentos?.endereco}</p>
                </div>
              </div>
            </div>

            {/* Horários */}
            {(servico.hora_agendamento || servico.hora_inicio || servico.hora_fim) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Horários</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {servico.hora_agendamento && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Agendado</label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{servico.hora_agendamento}</span>
                        </div>
                      </div>
                    )}
                    
                    {servico.hora_inicio && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Início</label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span>{servico.hora_inicio}</span>
                        </div>
                      </div>
                    )}
                    
                    {servico.hora_fim && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Fim</label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span>{servico.hora_fim}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Operador Responsável */}
            {servico.operadores && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Operador Responsável</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{servico.operadores.nome}</span>
                  </div>
                </div>
              </>
            )}

            {/* Observações */}
            {servico.observacoes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Observações do Agendamento</h3>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{servico.observacoes}</p>
                  </div>
                </div>
              </>
            )}

            {/* Detalhes da Execução */}
            {servico.status === 'concluido' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalhes da Execução</h3>
                  
                  {servico.data_execucao && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Data de Execução</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(servico.data_execucao).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  )}
                  
                  {servico.descricao_servico_realizado && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Descrição do Serviço Realizado</label>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{servico.descricao_servico_realizado}</p>
                      </div>
                    </div>
                  )}
                  
                  {servico.materiais_utilizados && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Materiais Utilizados</label>
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{servico.materiais_utilizados}</p>
                      </div>
                    </div>
                  )}
                  
                  {servico.observacoes_execucao && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Observações da Execução</label>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{servico.observacoes_execucao}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Fotos do Serviço */}
                  {servico.fotos_servico && servico.fotos_servico.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Fotos do Serviço ({servico.fotos_servico.length})
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {servico.fotos_servico.map((foto: string, index: number) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={foto}
                              alt={`Foto ${index + 1} do serviço`}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(foto, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Serviço não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}