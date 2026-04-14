import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { Loader2, Download } from 'lucide-react'
import { exportarRegistroAtendimento } from '@/lib/exportRegistroAtendimento'
import { useToast } from '@/hooks/use-toast'

interface DetalhesExecucaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicoId: string | null
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
        data_execucao: servico.updated_at,
      })
      toast({ title: 'PDF gerado com sucesso', description: 'O arquivo foi baixado.' })
    } catch {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' })
    } finally {
      setGerando(false)
    }
  }

  const tecnicoNome = (servico?.operadores as any)?.nome ?? '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : servico ? (
          <ScrollArea className="max-h-[88vh]">
            <div className="p-6 space-y-5">

              {/* === HEADER === */}
              <div className="flex items-end justify-between border-b-2 border-blue-500 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-blue-600 uppercase tracking-wide">
                    Relatório de Atendimento
                  </h2>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] text-gray-400">
                    Gerado em: {format(new Date(), 'dd/MM/yyyy')}
                  </p>
                  {servico.numero_protocolo && (
                    <p className="text-[10px] text-gray-400">
                      Protocolo: <span className="font-semibold text-gray-600">#{servico.numero_protocolo}</span>
                    </p>
                  )}
                  <Button variant="outline" size="sm" onClick={handleGerarPDF} disabled={gerando} className="mt-1 h-7 text-xs">
                    {gerando ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                    Gerar PDF
                  </Button>
                </div>
              </div>

              {/* === BADGE TIPO SERVIÇO === */}
              <div>
                <span className="inline-block bg-blue-600 text-white text-xs font-bold uppercase px-4 py-1.5 rounded-full tracking-wider">
                  {servico.tipo_servico}
                </span>
              </div>

              {/* === RESUMO DA ATIVIDADE === */}
              <div>
                <SectionTitle>Resumo da Atividade</SectionTitle>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-gray-50 rounded-md p-4 mt-2">
                  <InfoItem label="Condomínio / Local" value={servico.condominio_nome_original} />
                  <InfoItem label="Unidade" value={[servico.bloco && `Bloco ${servico.bloco}`, servico.apartamento && `Apto ${servico.apartamento}`].filter(Boolean).join(' - ') || '—'} />
                  <InfoItem label="Estado" value={servico.uf} />
                  <InfoItem label="Cliente" value={servico.morador_nome} />
                  <InfoItem label="Telefone" value={servico.telefone} />
                  <InfoItem label="E-mail" value={servico.email} />
                  {servico.data_agendamento && (
                    <InfoItem label="Agendamento" value={formatDate(servico.data_agendamento)} />
                  )}
                  {servico.turno && (
                    <InfoItem label="Turno" value={turnoLabels[servico.turno] ?? servico.turno} />
                  )}
                  {servico.data_solicitacao && (
                    <InfoItem label="Data Solicitação" value={formatDate(servico.data_solicitacao)} />
                  )}
                </div>
              </div>

              {/* === OBSERVAÇÃO DO TÉCNICO === */}
              {texto && (
                <div>
                  <SectionTitle>Observação do Técnico</SectionTitle>
                  <div className="mt-2 border border-gray-200 rounded-md p-4 bg-white min-h-[80px]">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{texto}</p>
                  </div>
                </div>
              )}

              {/* === PAGAMENTO E CADASTRO === */}
              {(servico.forma_pagamento || servico.valor_servico != null || servico.cpf_cnpj) && (
                <div>
                  <SectionTitle>Informações de Pagamento e Cadastro</SectionTitle>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-gray-50 rounded-md p-4 mt-2">
                    {servico.forma_pagamento && (
                      <InfoItem label="Forma de Pagamento" value={servico.forma_pagamento} />
                    )}
                    {servico.valor_servico != null && (
                      <InfoItem label="Valor do Serviço" value={`R$ ${Number(servico.valor_servico).toFixed(2).replace('.', ',')}`} />
                    )}
                    {servico.cpf_cnpj && (
                      <InfoItem label="CPF / CNPJ" value={servico.cpf_cnpj} />
                    )}
                  </div>
                </div>
              )}

              {/* === ASSINATURAS === */}
              <div className="grid grid-cols-2 gap-8 mt-2">
                {/* Assinatura do Cliente */}
                <div className="text-center">
                  {servico.assinatura_url ? (
                    <div className="border border-gray-200 rounded-md p-3 bg-white mb-2 min-h-[80px] flex items-center justify-center">
                      <img src={servico.assinatura_url} alt="Assinatura do cliente" className="max-h-24 mx-auto" />
                    </div>
                  ) : (
                    <div className="min-h-[80px]" />
                  )}
                  <div className="border-t border-gray-400 pt-1.5 mx-4">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Assinatura do Cliente</p>
                  </div>
                </div>
                {/* Responsável Técnico */}
                <div className="text-center">
                  <div className="min-h-[80px] flex items-end justify-center pb-2">
                    <p className="text-sm font-semibold text-gray-700">{tecnicoNome}</p>
                  </div>
                  <div className="border-t border-gray-400 pt-1.5 mx-4">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Responsável Técnico</p>
                  </div>
                </div>
              </div>

              {/* === REGISTRO FOTOGRÁFICO === */}
              {fotos.length > 0 && (
                <div>
                  <SectionTitle>Registro Fotográfico</SectionTitle>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {fotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <img src={url} alt={`Registro ${String(i + 1).padStart(2, '0')}`} className="w-full aspect-[4/3] object-cover" />
                          <p className="text-center text-[10px] text-gray-500 py-1.5 font-medium">
                            Registro {String(i + 1).padStart(2, '0')}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* === FOOTER === */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-[9px] text-gray-400">
                  Relatório de Atendimento Gerado via Sistema
                </p>
              </div>

            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-gray-200 pb-1">
      {children}
    </h3>
  )
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[8pt] uppercase text-gray-400 font-bold tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
    </div>
  )
}
