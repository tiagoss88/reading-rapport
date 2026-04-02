import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, Camera, CreditCard, DollarSign, User, PenTool, Loader2 
} from 'lucide-react'

interface DetalhesExecucaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicoId: string | null
}

function parseObservacao(obs: string | null): { fotos: string[]; texto: string } {
  if (!obs) return { fotos: [], texto: '' }
  
  const fotosMatch = obs.match(/Fotos comprovante:\s*(https?:\/\/[^\s|]+(?:\s*,\s*https?:\/\/[^\s|]+)*)/i)
  const fotos: string[] = []
  
  if (fotosMatch) {
    fotosMatch[1].split(',').forEach(url => {
      const trimmed = url.trim()
      if (trimmed) fotos.push(trimmed)
    })
  }

  const obsMatch = obs.match(/\|\s*Obs:\s*(.*)/i)
  const texto = obsMatch ? obsMatch[1].trim() : (!fotosMatch ? obs.trim() : '')

  return { fotos, texto }
}

export default function DetalhesExecucaoDialog({ open, onOpenChange, servicoId }: DetalhesExecucaoDialogProps) {
  const { data: servico, isLoading } = useQuery({
    queryKey: ['detalhes-execucao', servicoId],
    queryFn: async () => {
      if (!servicoId) return null
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select('*, empreendimentos_terceirizados(nome), operadores:tecnico_id(nome)')
        .eq('id', servicoId)
        .single()
      if (error) throw error
      return data
    },
    enabled: open && !!servicoId,
  })

  if (!servicoId) return null

  const { fotos, texto } = parseObservacao(servico?.observacao ?? null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalhes da Execução
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : servico ? (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-5">
              {/* Observação do técnico */}
              {texto && (
                <Section icon={<FileText className="w-4 h-4 text-primary" />} title="Observação do Técnico">
                  <p className="text-sm whitespace-pre-wrap">{texto}</p>
                </Section>
              )}

              {/* Fotos */}
              {fotos.length > 0 && (
                <Section icon={<Camera className="w-4 h-4 text-primary" />} title="Registro Fotográfico">
                  <div className="grid grid-cols-2 gap-2">
                    {fotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </Section>
              )}

              {/* Forma de pagamento */}
              {servico.forma_pagamento && (
                <Section icon={<CreditCard className="w-4 h-4 text-primary" />} title="Forma de Pagamento">
                  <Badge variant="secondary">{servico.forma_pagamento}</Badge>
                </Section>
              )}

              {/* Valor do serviço */}
              {servico.valor_servico != null && (
                <Section icon={<DollarSign className="w-4 h-4 text-primary" />} title="Valor do Serviço">
                  <p className="text-sm font-semibold">
                    R$ {Number(servico.valor_servico).toFixed(2).replace('.', ',')}
                  </p>
                </Section>
              )}

              {/* CPF/CNPJ */}
              {servico.cpf_cnpj && (
                <Section icon={<User className="w-4 h-4 text-primary" />} title="CPF/CNPJ">
                  <p className="text-sm">{servico.cpf_cnpj}</p>
                </Section>
              )}

              {/* Assinatura */}
              {servico.assinatura_url && (
                <Section icon={<PenTool className="w-4 h-4 text-primary" />} title="Assinatura do Cliente">
                  <div className="border rounded-lg p-2 bg-background">
                    <img
                      src={servico.assinatura_url}
                      alt="Assinatura do cliente"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </Section>
              )}

              {/* Sem dados */}
              {!texto && fotos.length === 0 && !servico.forma_pagamento && servico.valor_servico == null && !servico.cpf_cnpj && !servico.assinatura_url && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado de execução registrado.
                </p>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  )
}
