import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, User, Building2, Calendar, Clock, CheckCircle, Loader2, AlertCircle, Phone, Mail, ChevronRight, Copy, Check, Search, MapPin, Wrench, ClipboardList, AlertTriangle, Eye, Flame, Settings, Zap } from 'lucide-react'
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
  tecnico?: {
    nome: string
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
  const [searchTerm, setSearchTerm] = useState('')
  
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
          numero_protocolo,
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
          empreendimento:empreendimentos_terceirizados(nome, endereco),
          tecnico:operadores!servicos_nacional_gas_tecnico_id_fkey(nome)
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
        return <Badge className="bg-[#ff9800] hover:bg-[#e68a00] text-white border-0">Pendente</Badge>
      case 'agendado':
        return <Badge className="bg-[#007bff] hover:bg-[#0069d9] text-white border-0">Agendado</Badge>
      case 'executado':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Executado</Badge>
      case 'cancelado':
        return <Badge className="bg-[#f44336] hover:bg-[#d32f2f] text-white border-0">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getServiceIcon = (tipo: string) => {
    const t = tipo.toLowerCase()
    if (t.includes('troca') || t.includes('medidor')) return <Wrench className="w-4 h-4" />
    if (t.includes('inspe') || t.includes('vistoria')) return <AlertTriangle className="w-4 h-4" />
    if (t.includes('religa')) return <Flame className="w-4 h-4" />
    if (t.includes('corte') || t.includes('desliga')) return <Settings className="w-4 h-4" />
    return <ClipboardList className="w-4 h-4" />
  }

  const openMaps = (endereco: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`, '_blank')
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
                      {(() => {
                        const iso = String(selectedServico.data_agendamento).slice(0, 10);
                        const d = new Date(iso + 'T00:00:00');
                        return isNaN(d.getTime()) ? '—' : format(d, "dd/MM/yyyy", { locale: ptBR });
                      })()}
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

  // Helper para identificar serviços essenciais
  const isEssencial = (tipo: string) => {
    const t = (tipo || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return t.includes('religacao') || t.includes('desligamento')
  }

  // Filtered list
  const filteredServicos = servicos.filter(s => {
    const matchUF = selectedUF === 'todos' || s.uf === selectedUF
    if (!matchUF) return false
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase().trim()
    return (
      s.condominio_nome_original.toLowerCase().includes(term) ||
      (s.morador_nome && s.morador_nome.toLowerCase().includes(term)) ||
      (s.empreendimento?.endereco && s.empreendimento.endereco.toLowerCase().includes(term)) ||
      (s.tipo_servico && s.tipo_servico.toLowerCase().includes(term)) ||
      (s.numero_protocolo && s.numero_protocolo.toLowerCase().includes(term)) ||
      (s.apartamento && s.apartamento.toLowerCase().includes(term)) ||
      (s.bloco && s.bloco.toLowerCase().includes(term)) ||
      (s.bloco && s.apartamento && `bl ${s.bloco} ap ${s.apartamento}`.toLowerCase().includes(term)) ||
      (s.bloco && s.apartamento && `bloco ${s.bloco} apto ${s.apartamento}`.toLowerCase().includes(term))
    )
  })

  const essenciais = filteredServicos.filter(s => isEssencial(s.tipo_servico))
  const programados = filteredServicos.filter(s => !isEssencial(s.tipo_servico))

  // Agrupamento: Data -> Turno -> Condomínio
  const turnoOrder = (t: string | null) => {
    const v = (t || '').toLowerCase()
    if (v === 'manha' || v === 'manhã') return 0
    if (v === 'tarde') return 1
    if (v === 'noite') return 2
    return 3
  }

  const formatDataLabel = (iso: string | null) => {
    if (!iso) return 'Sem data agendada'
    const d = new Date(String(iso).slice(0, 10) + 'T00:00:00')
    if (isNaN(d.getTime())) return 'Sem data agendada'
    const label = format(d, "EEEE, dd/MM/yyyy", { locale: ptBR })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  const programadosAgrupados = (() => {
    const byData = new Map<string, ServicoTerceirizado[]>()
    programados.forEach(s => {
      const iso = s.data_agendamento ? String(s.data_agendamento).slice(0, 10) : ''
      const key = isNaN(new Date(iso + 'T00:00:00').getTime()) ? '' : iso
      if (!byData.has(key)) byData.set(key, [])
      byData.get(key)!.push(s)
    })

    return Array.from(byData.entries())
      .sort(([a], [b]) => {
        if (!a) return 1
        if (!b) return -1
        return a.localeCompare(b)
      })
      .map(([dataKey, itensData]) => {
        const byTurno = new Map<string, ServicoTerceirizado[]>()
        itensData.forEach(s => {
          const key = s.turno || ''
          if (!byTurno.has(key)) byTurno.set(key, [])
          byTurno.get(key)!.push(s)
        })

        const turnos = Array.from(byTurno.entries())
          .sort(([a], [b]) => turnoOrder(a) - turnoOrder(b))
          .map(([turnoKey, itensTurno]) => {
            const byCondominio = new Map<string, ServicoTerceirizado[]>()
            itensTurno.forEach(s => {
              const key = s.condominio_nome_original || 'Sem condomínio'
              if (!byCondominio.has(key)) byCondominio.set(key, [])
              byCondominio.get(key)!.push(s)
            })

            const condominios = Array.from(byCondominio.entries())
              .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
              .map(([nome, itens]) => ({ nome, itens }))

            return {
              turnoKey,
              turnoLabel: turnoKey ? getTurnoLabel(turnoKey) : 'Sem turno',
              total: itensTurno.length,
              condominios,
            }
          })

        return {
          dataKey,
          dataLabel: formatDataLabel(dataKey || null),
          total: itensData.length,
          turnos,
        }
      })
  })()


  // Renderizador de card reutilizável (variante essencial ou programado)
  const renderCard = (servico: ServicoTerceirizado, variant: 'essencial' | 'programado', index: number) => {
    const endereco = servico.empreendimento?.endereco || servico.condominio_nome_original
    const sidebarGradient =
      variant === 'essencial'
        ? 'bg-gradient-to-b from-[#ff6b6b] to-[#ee5a6f]'
        : 'bg-gradient-to-b from-[#4ecdc4] to-[#6c5ce7]'
    const badgeGradient =
      variant === 'essencial'
        ? 'bg-gradient-to-br from-[#ff6b6b] to-[#ee5a6f]'
        : 'bg-gradient-to-br from-[#4ecdc4] to-[#6c5ce7]'
    const badgeLabel = variant === 'essencial' ? 'ESSENCIAL' : 'PROGRAMADO'

    return (
      <div
        key={servico.id}
        onClick={() => setSelectedServico(servico)}
        className="flex bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-in"
        style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
      >
        {/* Sidebar colorida */}
        <div className={`w-1 shrink-0 ${sidebarGradient}`} />

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
            <div className="min-w-0 flex-1">
              <span
                className={`inline-block ${badgeGradient} text-white text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full mb-1.5`}
              >
                {badgeLabel}
              </span>
              <div className="flex items-center gap-2 text-primary">
                {getServiceIcon(servico.tipo_servico)}
                <span className="font-semibold text-sm uppercase truncate">
                  {servico.tipo_servico}
                </span>
              </div>
            </div>
            {getStatusBadge(servico.status_atendimento)}
          </div>

          {/* Body */}
          <div className="px-4 pb-2">
            <p className="font-bold text-foreground truncate">
              {servico.condominio_nome_original}
            </p>
            {(servico.bloco || servico.apartamento) && (
              <p className="text-sm text-muted-foreground">
                {servico.bloco && `Bloco ${servico.bloco}`}
                {servico.bloco && servico.apartamento && ', '}
                {servico.apartamento && `Apto ${servico.apartamento}`}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {(() => {
                  if (!servico.data_agendamento) return 'Sem data';
                  const iso = String(servico.data_agendamento).slice(0, 10);
                  const d = new Date(iso + 'T00:00:00');
                  return isNaN(d.getTime()) ? 'Sem data' : format(d, 'dd/MM', { locale: ptBR });
                })()}
                {servico.turno && ` · ${getTurnoLabel(servico.turno)}`}
              </span>
              {servico.tecnico?.nome && (
                <span className="flex items-center gap-1 pl-1.5 ml-1.5 border-l">
                  <User className="w-3.5 h-3.5" />
                  {servico.tecnico.nome}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation()
                openMaps(endereco)
              }}
            >
              <MapPin className="w-3.5 h-3.5" />
              Ver Endereço
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f8fc] to-[#f1f5fb] p-4">
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
            <h1 className="text-xl font-bold text-gray-900 text-left">Lista de Serviços</h1>
            <p className="text-sm text-gray-600">
              Todos os serviços da Nacional Gás
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por condomínio, apto, bloco, morador, endereço, tipo ou protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
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
        {!loading && filteredServicos.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum serviço encontrado</p>
                <p className="text-sm mt-1">
                  {searchTerm ? 'Tente buscar com outros termos.' : 'Você não tem serviços terceirizados pendentes no momento.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção: Serviços Essenciais */}
        {!loading && essenciais.length > 0 && (
          <section className="space-y-3 pt-2">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ee5a6f] flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-br from-[#ff6b6b] to-[#ee5a6f] bg-clip-text text-transparent">
                  Serviços Essenciais
                </h2>
                <span className="ml-auto text-xs font-semibold text-white bg-gradient-to-br from-[#ff6b6b] to-[#ee5a6f] px-2 py-0.5 rounded-full">
                  {essenciais.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 ml-[42px]">
                Serviços prioritários: religação, religação automática, religação emergencial e desligamento
              </p>
            </div>
            <div className="space-y-3">
              {essenciais.map((s, i) => renderCard(s, 'essencial', i))}
            </div>
          </section>
        )}

        {/* Seção: Serviços Programados */}
        {!loading && programados.length > 0 && (
          <section className="space-y-3 pt-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4ecdc4] to-[#6c5ce7] flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-br from-[#4ecdc4] to-[#6c5ce7] bg-clip-text text-transparent">
                  Serviços Programados
                </h2>
                <span className="ml-auto text-xs font-semibold text-white bg-gradient-to-br from-[#4ecdc4] to-[#6c5ce7] px-2 py-0.5 rounded-full">
                  {programados.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 ml-[42px]">
                Demais serviços agendados para execução
              </p>
            </div>
            <div className="space-y-5">
              {programadosAgrupados.map((grupoData) => (
                <div key={grupoData.dataKey || 'sem-data'} className="space-y-3">
                  {/* Cabeçalho de data */}
                  <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#6c5ce7]/20">
                    <Calendar className="w-4 h-4 text-[#6c5ce7]" />
                    <span className="text-sm font-bold text-foreground">{grupoData.dataLabel}</span>
                    <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
                      {grupoData.total} {grupoData.total === 1 ? 'serviço' : 'serviços'}
                    </span>
                  </div>

                  {grupoData.turnos.map((grupoTurno) => (
                    <div key={grupoTurno.turnoKey || 'sem-turno'} className="space-y-2.5 pl-1">
                      {/* Turno */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide text-white bg-gradient-to-br from-[#4ecdc4] to-[#6c5ce7] px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {grupoTurno.turnoLabel.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{grupoTurno.total}</span>
                      </div>

                      {grupoTurno.condominios.map((grupoCond) => (
                        <div key={grupoCond.nome} className="space-y-2">
                          {/* Condomínio */}
                          <div className="flex items-center gap-1.5 pl-0.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                              {grupoCond.nome}
                            </span>
                            <span className="text-[11px] text-muted-foreground/70">
                              ({grupoCond.itens.length})
                            </span>
                          </div>
                          <div className="space-y-3">
                            {grupoCond.itens.map((s, i) => renderCard(s, 'programado', i))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
