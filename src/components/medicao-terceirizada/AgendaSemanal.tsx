import { useState, useMemo, useCallback, useRef, memo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, CalendarDays, GripVertical, MapPin, User, Clock, FileText } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
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
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  executado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  executado: 'Executado',
  cancelado: 'Cancelado',
}

const statusBorderColor: Record<string, string> = {
  pendente: 'border-l-yellow-500',
  agendado: 'border-l-blue-500',
  executado: 'border-l-green-500',
  cancelado: 'border-l-red-500',
}

const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function extrairBairro(endereco?: string | null): string {
  if (!endereco) return '-'
  const parts = endereco.split(',').map(p => p.trim())
  if (parts.length >= 2) return parts[1]
  return endereco
}

// ─── Service Card ───────────────────────────────────────────────────────────────
interface ServiceCardProps {
  servico: ServicoNacionalGas
  index: number
  onSelect: (s: ServicoNacionalGas) => void
  onDragStart: (e: React.DragEvent, id: string, sourceKey: string) => void
  onDragEnd: () => void
  onDragOverCard: (e: React.DragEvent, targetId: string) => void
  onDropOnCard: (e: React.DragEvent, targetId: string, targetKey: string) => void
  sourceKey: string
  isDragging: boolean
  isDragOver: boolean
}

const ServiceCard = memo(function ServiceCard({
  servico, index, onSelect, onDragStart, onDragEnd,
  onDragOverCard, onDropOnCard, sourceKey, isDragging, isDragOver,
}: ServiceCardProps) {
  const hasBlocoApt = servico.bloco || servico.apartamento
  const location = hasBlocoApt
    ? `${servico.bloco ? `Bl. ${servico.bloco}` : ''}${servico.bloco && servico.apartamento ? ' - ' : ''}${servico.apartamento ? `Apto ${servico.apartamento}` : ''}`
    : null

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, servico.id, sourceKey)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOverCard(e, servico.id)}
      onDrop={(e) => onDropOnCard(e, servico.id, sourceKey)}
      onClick={() => onSelect(servico)}
      className={`
        group relative rounded-lg border border-l-4 bg-card p-3
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        ${statusBorderColor[servico.status_atendimento] || 'border-l-muted'}
        ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:-translate-y-0.5'}
        ${isDragOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}
      `}
    >
      {/* Execution order badge */}
      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm">
        {index + 1}
      </div>

      {/* Drag handle */}
      <div className="absolute top-2 left-1 opacity-0 group-hover:opacity-60 transition-opacity">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-foreground truncate pr-7 pl-3">
        {servico.condominio_nome_original}
      </p>

      {/* Location */}
      {location && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 pl-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      )}

      {/* Type + Status row */}
      <div className="flex items-center gap-1.5 mt-2 pl-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5 truncate max-w-[120px]">
          {servico.tipo_servico}
        </span>
        <Badge className={`text-[10px] px-1.5 py-0 leading-4 ${statusColors[servico.status_atendimento] || ''}`}>
          {statusLabels[servico.status_atendimento] || servico.status_atendimento}
        </Badge>
      </div>
    </div>
  )
})

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AgendaSemanal({ servicos, onSelectServico }: AgendaSemanalProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [ufFilter, setUfFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tipoFilter, setTipoFilter] = useState('all')
  const [bairroFilter, setBairroFilter] = useState('all')

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragSourceKey, setDragSourceKey] = useState<string | null>(null)
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null)
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null)

  // Local ordering per column (key = date string or 'unscheduled')
  const [localOrder, setLocalOrder] = useState<Record<string, string[]>>({})

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  // Filter values
  const ufs = useMemo(() => [...new Set(servicos.map(s => s.uf))].sort(), [servicos])
  const tipos = useMemo(() => [...new Set(servicos.map(s => s.tipo_servico))].filter(Boolean).sort(), [servicos])
  const bairros = useMemo(() => {
    const list = servicos
      .map(s => extrairBairro((s.empreendimento as any)?.endereco))
      .filter(b => b !== '-')
    return [...new Set(list)].sort()
  }, [servicos])

  // Filtered servicos
  const filtered = useMemo(() =>
    servicos.filter(s => {
      if ((s.tipo_servico || '').toLowerCase().includes('leitura')) return false
      if (s.status_atendimento === 'executado') return false
      if (s.status_atendimento === 'cancelado') return false
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

  // Group by column key
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

  // Apply local ordering
  const getOrderedList = useCallback((items: ServicoNacionalGas[], key: string) => {
    const order = localOrder[key]
    if (!order) return items
    const map = new Map(items.map(s => [s.id, s]))
    const ordered: ServicoNacionalGas[] = []
    for (const id of order) {
      const s = map.get(id)
      if (s) {
        ordered.push(s)
        map.delete(id)
      }
    }
    // Add any items not in the local order
    for (const s of map.values()) ordered.push(s)
    return ordered
  }, [localOrder])

  // Mutation for cross-day drag
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

  // ─── Drag Handlers ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, id: string, sourceKey: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(id)
    setDragSourceKey(sourceKey)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragSourceKey(null)
    setDragOverCardId(null)
    setDragOverColumnKey(null)
  }, [])

  const handleColumnDragOver = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumnKey(columnKey)
  }, [])

  const handleColumnDragLeave = useCallback(() => {
    setDragOverColumnKey(null)
  }, [])

  const handleDragOverCard = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCardId(targetId)
  }, [])

  const handleDropOnCard = useCallback((e: React.DragEvent, targetId: string, targetKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    const dragId = e.dataTransfer.getData('text/plain')
    if (!dragId || dragId === targetId) {
      handleDragEnd()
      return
    }

    if (dragSourceKey === targetKey) {
      // Same column: reorder locally
      const currentItems = targetKey === 'unscheduled' ? semAgendamento : 
        servicosPorDia[weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === targetKey)]
      if (!currentItems) { handleDragEnd(); return }

      const currentOrder = localOrder[targetKey] || currentItems.map(s => s.id)
      const fromIdx = currentOrder.indexOf(dragId)
      const toIdx = currentOrder.indexOf(targetId)
      if (fromIdx === -1 || toIdx === -1) { handleDragEnd(); return }

      const newOrder = [...currentOrder]
      newOrder.splice(fromIdx, 1)
      newOrder.splice(toIdx, 0, dragId)
      setLocalOrder(prev => ({ ...prev, [targetKey]: newOrder }))
    } else {
      // Cross column: update date
      const newDate = targetKey === 'unscheduled' ? null : targetKey
      updateMutation.mutate({ id: dragId, data_agendamento: newDate })
    }
    handleDragEnd()
  }, [dragSourceKey, semAgendamento, servicosPorDia, weekDays, localOrder, updateMutation, handleDragEnd])

  const handleColumnDrop = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) { handleDragEnd(); return }

    if (dragSourceKey === columnKey) {
      // Dropped on empty area of same column — no-op
      handleDragEnd()
      return
    }

    const newDate = columnKey === 'unscheduled' ? null : columnKey
    updateMutation.mutate({ id, data_agendamento: newDate })
    handleDragEnd()
  }, [dragSourceKey, updateMutation, handleDragEnd])

  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  // ─── Column Renderer ────────────────────────────────────────────────────────
  const renderColumn = (
    items: ServicoNacionalGas[],
    columnKey: string,
    header: React.ReactNode,
    isToday: boolean = false
  ) => {
    const ordered = getOrderedList(items, columnKey)
    return (
      <div
        className={`
          rounded-xl border flex flex-col overflow-hidden transition-all duration-200
          ${isToday
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'bg-muted/20 hover:shadow-sm'
          }
          ${dragOverColumnKey === columnKey && dragSourceKey !== columnKey
            ? 'ring-2 ring-primary/30 bg-primary/5'
            : ''
          }
        `}
        onDragOver={(e) => handleColumnDragOver(e, columnKey)}
        onDragLeave={handleColumnDragLeave}
        onDrop={(e) => handleColumnDrop(e, columnKey)}
      >
        {/* Column header */}
        <div className={`px-3 py-2.5 border-b ${isToday ? 'bg-primary/10 border-primary/20' : 'bg-muted/30'}`}>
          {header}
        </div>

        {/* Cards */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {ordered.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-6 italic">
                Nenhum serviço
              </p>
            ) : (
              ordered.map((s, idx) => (
                <ServiceCard
                  key={s.id}
                  servico={s}
                  index={idx}
                  onSelect={onSelectServico}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOverCard={handleDragOverCard}
                  onDropOnCard={handleDropOnCard}
                  sourceKey={columnKey}
                  isDragging={draggedId === s.id}
                  isDragOver={dragOverCardId === s.id && draggedId !== s.id}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[210px] text-center">
            Semana de {format(currentWeekStart, "dd/MM/yyyy")} a {format(addDays(currentWeekStart, 6), "dd/MM/yyyy")}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={goToToday}>
            <CalendarDays className="mr-1 h-3.5 w-3.5" />
            Hoje
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={ufFilter} onValueChange={setUfFilter}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas UFs</SelectItem>
            {ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={bairroFilter} onValueChange={setBairroFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Bairro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Bairros</SelectItem>
            {bairros.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-8 gap-2 min-h-[420px]">
        {/* Sem Agendamento */}
        {renderColumn(
          semAgendamento,
          'unscheduled',
          <div className="text-center">
            <div className="text-[11px] font-semibold text-muted-foreground">Sem Agendamento</div>
            <div className="inline-flex items-center justify-center mt-1 w-5 h-5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
              {semAgendamento.length}
            </div>
          </div>
        )}

        {/* Day Columns */}
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, new Date())
          const dayServicos = servicosPorDia[idx]
          const dateKey = format(day, 'yyyy-MM-dd')
          return (
            <div key={dateKey}>
              {renderColumn(
                dayServicos,
                dateKey,
                <div className="text-center">
                  <div className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {diasSemana[idx]}
                  </div>
                  <div className={`text-[11px] font-mono ${isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {format(day, 'dd/MM')}
                  </div>
                  <div className={`inline-flex items-center justify-center mt-1 w-5 h-5 rounded-full text-[10px] font-bold ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {dayServicos.length}
                  </div>
                </div>,
                isToday
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
