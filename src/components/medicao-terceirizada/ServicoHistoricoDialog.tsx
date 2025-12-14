import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { History, User } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicoId: string
}

const fieldLabels: Record<string, string> = {
  data_agendamento: 'Data de Agendamento',
  status_atendimento: 'Status',
  turno: 'Turno',
  tecnico_id: 'Técnico',
  observacao: 'Observação'
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  executado: 'Executado',
  cancelado: 'Cancelado'
}

const turnoLabels: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde'
}

export default function ServicoHistoricoDialog({ open, onOpenChange, servicoId }: Props) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ['servico-historico', servicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_nacional_gas_historico')
        .select('*')
        .eq('servico_id', servicoId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: open
  })

  const { data: operadores } = useQuery({
    queryKey: ['operadores-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome')
      
      if (error) throw error
      return data.reduce((acc, op) => {
        acc[op.id] = op.nome
        return acc
      }, {} as Record<string, string>)
    },
    enabled: open
  })

  const formatValue = (campo: string, valor: string | null): string => {
    if (!valor) return '-'
    
    if (campo === 'status_atendimento') {
      return statusLabels[valor] || valor
    }
    
    if (campo === 'turno') {
      return turnoLabels[valor] || valor
    }
    
    if (campo === 'tecnico_id' && operadores) {
      return operadores[valor] || 'Desconhecido'
    }
    
    if (campo === 'data_agendamento') {
      try {
        return format(new Date(valor), 'dd/MM/yyyy')
      } catch {
        return valor
      }
    }
    
    return valor
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : historico?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma alteração registrada
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pr-4">
              {historico?.map((item) => (
                <div key={item.id} className="border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {fieldLabels[item.campo_alterado] || item.campo_alterado}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">De:</span>
                      <p className="text-red-600 dark:text-red-400 line-through">
                        {formatValue(item.campo_alterado, item.valor_anterior)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Para:</span>
                      <p className="text-green-600 dark:text-green-400">
                        {formatValue(item.campo_alterado, item.valor_novo)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
