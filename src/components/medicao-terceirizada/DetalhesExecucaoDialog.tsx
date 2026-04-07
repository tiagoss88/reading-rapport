import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { 
  FileText, Camera, CreditCard, DollarSign, User, PenTool, Loader2, Download,
  Building2, MapPin, Home, Phone, Mail, Calendar, Clock, Wrench
} from 'lucide-react'
import { exportarRegistroAtendimento } from '@/lib/exportRegistroAtendimento'
import { useToast } from '@/hooks/use-toast'

interface DetalhesExecucaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicoId: string | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  agendado: { label: 'Agendado', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  executado: { label: 'Executado', className: 'bg-green-100 text-green-800 border-green-300' },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-300' },
  remarcado: { label: 'Remarcado', className: 'bg-orange-100 text-orange-800 border-orange-300' },
}

const turnoLabels: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  integral: 'Integral',
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

function formatDate(date: string | null): string {
  if (!date) return '—'
  try {
    return format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy')
  } catch {
    return date
  }
}

export default function DetalhesExecucaoDialog({ open, onOpenChange, servicoId }: DetalhesExecucaoDialogProps) {
  const { toast } = useToast()
  const [gerando, setGerando] = useState(false)

  const { data: servico, isLoading } = useQuery({
    queryKey: ['detalhes-execucao', servicoId],
    queryFn: async () => {
      if (!servicoId) return null
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select('*, empreendimentos_terceirizados(nome, endereco), operadores:tecnico_id(nome)')
        .eq('id', servicoId)
        .single()
      if (error) throw error
      return data
    },
    enabled: open && !!servicoId,
  })

  if (!servicoId) return null

  const { fotos, texto } = parseObservacao(servico?.observacao ?? null)
  const status = statusConfig[servico?.status_atendimento ?? ''] ?? { label: servico?.status_atendimento, className: 'bg-muted text-muted-foreground' }

  const handleGerarPDF = async () => {
    if (!servico) return
    setGerando(true)
    try {
      await exportarRegistroAtendimento({
        numero_protocolo: servico.numero_protocolo,
        morador_nome: servico.morador_nome,
        condominio: servico.condominio_nome_original,
        endereco: (servico.empreendimentos_terceirizados as any)?.endereco,
        bloco: servico.bloco,
        apartamento: servico.apartamento,
        uf: servico.uf,
        telefone: servico.telefone,
        email: servico.email,
        tipo_servico: servico.tipo_servico,
        data_agendamento: servico.data_agendamento,
        data_solicitacao: servico.data_solicitacao,
        turno: servico.turno,
        status_atendimento: servico.status_atendimento,
        tecnico_nome: (servico.operadores as any)?.nome,
        observacao_texto: texto,
        forma_pagamento: servico.forma_pagamento,
        valor_servico: servico.valor_servico,
        cpf_cnpj: servico.cpf_cnpj,
        assinatura_url: servico.assinatura_url,
        fotos_urls: fotos,
      })
      toast({ title: 'PDF gerado com sucesso', description: 'O arquivo foi baixado.' })
    } catch {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' })
    } finally {
      setGerando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Detalhes do Serviço
              {servico?.numero_protocolo && (
                <span className="text-xs font-mono text-muted-foreground ml-2">({servico.numero_protocolo})</span>
              )}
            </DialogTitle>
            {servico && (
              <Button variant="outline" size="sm" onClick={handleGerarPDF} disabled={gerando} className="mr-6">
                {gerando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
                Gerar PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : servico ? (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">

              {/* 1. Cabeçalho — Tipo + Status */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-sm font-semibold px-3 py-1">
                  {servico.tipo_servico}
                </Badge>
                <Badge className={`text-xs px-2.5 py-0.5 border ${status.className}`}>
                  {status.label}
                </Badge>
              </div>

              <Separator />

              {/* 2. Dados do Local */}
              <Section icon={<Building2 className="w-4 h-4 text-primary" />} title="Dados do Local">
                <InfoRow icon={<Building2 className="w-3.5 h-3.5 text-muted-foreground" />} label="Condomínio" value={servico.condominio_nome_original} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />} label="Endereço" value={(servico.empreendimentos_terceirizados as any)?.endereco} />
                <div className="flex gap-6">
                  <InfoRow icon={<Home className="w-3.5 h-3.5 text-muted-foreground" />} label="Bloco" value={servico.bloco} />
                  <InfoRow label="Apartamento" value={servico.apartamento} />
                  <InfoRow label="UF" value={servico.uf} />
                </div>
              </Section>

              <Separator />

              {/* 3. Dados do Cliente */}
              {(servico.morador_nome || servico.telefone || servico.email) && (
                <>
                  <Section icon={<User className="w-4 h-4 text-primary" />} title="Dados do Cliente">
                    <InfoRow icon={<User className="w-3.5 h-3.5 text-muted-foreground" />} label="Morador" value={servico.morador_nome} />
                    {servico.telefone && (
                      <InfoRow icon={<Phone className="w-3.5 h-3.5 text-muted-foreground" />} label="Telefone" value={servico.telefone} />
                    )}
                    {servico.email && (
                      <InfoRow icon={<Mail className="w-3.5 h-3.5 text-muted-foreground" />} label="Email" value={servico.email} />
                    )}
                  </Section>
                  <Separator />
                </>
              )}

              {/* 4. Dados do Serviço */}
              <Section icon={<Wrench className="w-4 h-4 text-primary" />} title="Dados do Serviço">
                {servico.data_solicitacao && (
                  <InfoRow icon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />} label="Solicitação" value={formatDate(servico.data_solicitacao)} />
                )}
                <InfoRow icon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />} label="Agendamento" value={formatDate(servico.data_agendamento)} />
                {servico.turno && (
                  <InfoRow icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />} label="Turno" value={turnoLabels[servico.turno] ?? servico.turno} />
                )}
                <InfoRow icon={<Wrench className="w-3.5 h-3.5 text-muted-foreground" />} label="Técnico" value={(servico.operadores as any)?.nome} />
              </Section>

              {/* 5. Execução — Observação */}
              {texto && (
                <>
                  <Separator />
                  <Section icon={<FileText className="w-4 h-4 text-primary" />} title="Observação do Técnico">
                    <p className="text-sm whitespace-pre-wrap">{texto}</p>
                  </Section>
                </>
              )}

              {/* 6. Registro Fotográfico */}
              {fotos.length > 0 && (
                <>
                  <Separator />
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
                </>
              )}

              {/* 7. Dados Financeiros */}
              {(servico.forma_pagamento || servico.valor_servico != null || servico.cpf_cnpj) && (
                <>
                  <Separator />
                  <Section icon={<DollarSign className="w-4 h-4 text-primary" />} title="Dados Financeiros">
                    {servico.forma_pagamento && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Pagamento:</span>
                        <Badge variant="secondary" className="text-xs">{servico.forma_pagamento}</Badge>
                      </div>
                    )}
                    {servico.valor_servico != null && (
                      <InfoRow icon={<DollarSign className="w-3.5 h-3.5 text-muted-foreground" />} label="Valor" value={`R$ ${Number(servico.valor_servico).toFixed(2).replace('.', ',')}`} bold />
                    )}
                    {servico.cpf_cnpj && (
                      <InfoRow icon={<User className="w-3.5 h-3.5 text-muted-foreground" />} label="CPF/CNPJ" value={servico.cpf_cnpj} />
                    )}
                  </Section>
                </>
              )}

              {/* 8. Assinatura */}
              {servico.assinatura_url && (
                <>
                  <Separator />
                  <Section icon={<PenTool className="w-4 h-4 text-primary" />} title="Assinatura do Cliente">
                    <div className="border rounded-lg p-2 bg-background">
                      <img
                        src={servico.assinatura_url}
                        alt="Assinatura do cliente"
                        className="max-h-32 mx-auto"
                      />
                    </div>
                  </Section>
                </>
              )}

              {/* Nenhum dado */}
              {!texto && fotos.length === 0 && !servico.forma_pagamento && servico.valor_servico == null && !servico.cpf_cnpj && !servico.assinatura_url && !servico.morador_nome && (
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
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="space-y-1.5 pl-6">{children}</div>
    </div>
  )
}

function InfoRow({ icon, label, value, bold }: { icon?: React.ReactNode; label: string; value?: string | null; bold?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={`text-sm ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}
