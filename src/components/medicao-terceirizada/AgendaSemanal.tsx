import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ServicoNacionalGas {
  id: string
  condominio_nome_original: string
  bloco?: string | null
  apartamento?: string | null
  morador_nome?: string | null
  tipo_servico: string
  data_agendamento?: string | null
  status_atendimento: string
  turno?: string | null
  tecnico_id?: string | null
  observacao?: string | null
  uf: string
  empreendimento_id?: string | null
  empreendimento?: { nome: string; endereco?: string; rota?: number } | null
}

interface AgendaSemanalProps {
  servicos: ServicoNacionalGas[]
  onSelectServico: (servico: ServicoNacionalGas) => void
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  agendado: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  executado: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  cancelado: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  executado: 'Executado',
  cancelado: 'Cancelado',
}

const statusCardBorder: Record<string, string> = {
  pendente: 'border-l-yellow-500',
  agendado: 'border-l-blue-500',
  executado: 'border-l-green-500',
  cancelado: 'border-l-red-500',
}

const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function extrairBairro(endereco?: string | null): string {
  if (!endereco) return '-'
  // Try to extract neighborhood from address patterns like "Rua X, Bairro Y, Cidade"
  const parts = endereco.split(',').map(p => p.trim())
  if (parts.length >= 2) return parts[1]
  return endereco
}

export default function AgendaSemanal({ servicos, onSelectServico }: AgendaSemanalProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [ufFilter, setUfFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tipoFilter, setTipoFilter] = useState('all')
  const [bairroFilter, setBairroFilter] = useState('all')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  // Extract unique filter values
  const ufs = useMemo(() => [...new Set(servicos.map(s => s.uf))].sort(), [servicos])
  const tipos = useMemo(() => [...new Set(servicos.map(s => s.tipo_servico))].filter(Boolean).sort(), [servicos])
  const bairros = useMemo(() => {
    const list = servicos
      .map(s => extrairBairro((s.empreendimento as any)?.endereco))
      .filter(b => b !== '-')
    return [...new Set(list)].sort()
  }, [servicos])

  // Filter servicos
  const filtered = useMemo(() =>
    servicos.filter(s => {
      // Ocultar leituras (possuem sessão própria)
      if ((s.tipo_servico || '').toLowerCase().includes('leitura')) return false
      // Ocultar serviços já executados
      if (s.status_atendimento === 'executado') return false

      if (ufFilter !== 'all' && s.uf !== ufFilter) return false
      if (statusFilter !== 'all' && s.status_atendimento !== statusFilter) return false
      if (tipoFilter !== 'all' && s.tipo_servico !== tipoFilter) return false
      if (bairroFilter !== 'all') {
        const bairro = extrairBairro((s.empreendimento as any)?.endereco)
        if (bairro !== bairroFilter) return false
      }
      return true
    }),
    [servicos, ufFilter, statusFilter, tipoFilter, bairroFilter]
  )

  // Group by day
  const semAgendamento = useMemo(() => filtered.filter(s => !s.data_agendamento), [filtered])
  const servicosPorDia = useMemo(() =>
    weekDays.map(day =>
      filtered.filter(s => {
        if (!s.data_agendamento) return false
        return isSameDay(parseISO(s.data_agendamento), day)
      })
    ),
    [filtered, weekDays]
  )

  const updateMutation = useMutation({
    mutationFn: async ({ id, data_agendamento }: { id: string; data_agendamento: string | null }) => {
      const { error } = await supabase
        .from('servicos_nacional_gas')
        .update({ data_agendamento })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-nacional-gas'] })
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar agendamento', variant: 'destructive' })
    },
  })

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, date: string | null) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      updateMutation.mutate({ id, data_agendamento: date })
    }
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const renderCard = (servico: ServicoNacionalGas) => {
    const bairro = extrairBairro((servico.empreendimento as any)?.endereco)
    const rota = (servico.empreendimento as any)?.rota
    const hasBlocoApt = servico.bloco || servico.apartamento
    return (
      <div
        key={servico.id}
        draggable
        onDragStart={(e) => handleDragStart(e, servico.id)}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectServico(servico)}
        className={`p-2 rounded-md border border-l-4 ${statusCardBorder[servico.status_atendimento] || ''} bg-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow text-xs space-y-0.5 ${draggedId === servico.id ? 'opacity-50' : ''}`}
      >
        <p className="font-semibold text-foreground truncate">{servico.condominio_nome_original}</p>
        {hasBlocoApt && (
          <p className="text-muted-foreground truncate">
            {servico.bloco ? `Bloco ${servico.bloco}` : ''}
            {servico.bloco && servico.apartamento ? ' - ' : ''}
            {servico.apartamento ? `Apto ${servico.apartamento}` : ''}
          </p>
        )}
        <p className="text-muted-foreground truncate uppercase">{servico.tipo_servico}</p>
        <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[servico.status_atendimento] || ''}`}>
          {statusLabels[servico.status_atendimento] || servico.status_atendimento}
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            Semana de {format(currentWeekStart, "dd/MM/yyyy")} a {format(addDays(currentWeekStart, 6), "dd/MM/yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="mr-1 h-4 w-4" />
            Hoje
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={ufFilter} onValueChange={setUfFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas UFs</SelectItem>
            {ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="executado">Executado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={bairroFilter} onValueChange={setBairroFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Bairro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Bairros</SelectItem>
            {bairros.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-8 gap-2 min-h-[400px]">
        {/* Sem Agendamento Column */}
        <div
          className="rounded-lg border bg-muted/30 p-2 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="text-xs font-semibold text-center pb-2 border-b mb-2 text-muted-foreground">
            Sem Agendamento
            <span className="ml-1 text-[10px]">({semAgendamento.length})</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-1">
              {semAgendamento.map(renderCard)}
            </div>
          </ScrollArea>
        </div>

        {/* Day Columns */}
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, new Date())
          const dayServicos = servicosPorDia[idx]
          return (
            <div
              key={day.toISOString()}
              className={`rounded-lg border p-2 flex flex-col ${isToday ? 'border-primary bg-primary/5' : 'bg-muted/30'}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, format(day, 'yyyy-MM-dd'))}
            >
              <div className={`text-xs font-semibold text-center pb-2 border-b mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                <div>{diasSemana[idx]}</div>
                <div className="text-[11px]">{format(day, 'dd/MM')}</div>
                <span className="text-[10px]">({dayServicos.length})</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-1">
                  {dayServicos.map(renderCard)}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    </div>
  )
}
