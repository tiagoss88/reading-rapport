import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import MovimentacaoDialog, { MaterialOption } from './MovimentacaoDialog'

interface Movimentacao {
  id: string
  tipo: string
  quantidade: number
  motivo: string | null
  observacao: string | null
  servico_id: string | null
  created_at: string
  materiais: { nome: string; unidade: string } | null
}

interface Props {
  onChanged?: () => void
  refreshKey?: number
}

export default function MovimentacoesTab({ onChanged, refreshKey = 0 }: Props) {
  const { toast } = useToast()
  const [movs, setMovs] = useState<Movimentacao[]>([])
  const [materiais, setMateriais] = useState<MaterialOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroMaterial, setFiltroMaterial] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tipoInicial, setTipoInicial] = useState<'entrada' | 'saida'>('entrada')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [movRes, matRes] = await Promise.all([
      supabase
        .from('estoque_movimentacoes')
        .select('id, tipo, quantidade, motivo, observacao, servico_id, created_at, materiais(nome, unidade)')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('materiais').select('id, nome, unidade').eq('ativo', true).order('nome'),
    ])

    if (movRes.error) {
      toast({ title: 'Erro ao carregar movimentações', description: movRes.error.message, variant: 'destructive' })
    } else {
      setMovs((movRes.data || []) as any)
    }
    if (!matRes.error) setMateriais((matRes.data || []) as MaterialOption[])
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const filtradas = useMemo(() => {
    return movs.filter(m => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
      if (filtroMaterial !== 'todos' && (m as any).materiais?.nome !== filtroMaterial) return false
      const data = m.created_at.slice(0, 10)
      if (dataInicio && data < dataInicio) return false
      if (dataFim && data > dataFim) return false
      return true
    })
  }, [movs, filtroTipo, filtroMaterial, dataInicio, dataFim])

  const tipoBadge = (tipo: string) => {
    if (tipo === 'entrada') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Entrada</Badge>
    if (tipo === 'saida') return <Badge variant="destructive">Saída</Badge>
    return <Badge variant="secondary">Ajuste</Badge>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtroMaterial} onValueChange={setFiltroMaterial}>
            <SelectTrigger className="h-9 w-[200px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os materiais</SelectItem>
              {materiais.map(m => <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
              <SelectItem value="ajuste">Ajuste</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" className="h-9 w-[150px] text-xs" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <Input type="date" className="h-9 w-[150px] text-xs" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setTipoInicial('entrada'); setDialogOpen(true) }}>
            <ArrowDownCircle className="mr-2 h-4 w-4" />Entrada
          </Button>
          <Button size="sm" onClick={() => { setTipoInicial('saida'); setDialogOpen(true) }}>
            <ArrowUpCircle className="mr-2 h-4 w-4" />Saída
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 text-xs">Data</TableHead>
                <TableHead className="h-9 text-xs">Material</TableHead>
                <TableHead className="h-9 text-xs">Tipo</TableHead>
                <TableHead className="h-9 text-xs text-right">Qtd.</TableHead>
                <TableHead className="h-9 text-xs">Motivo</TableHead>
                <TableHead className="h-9 text-xs">Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-xs text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!loading && filtradas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-xs text-center py-6 text-muted-foreground">Nenhuma movimentação no período.</TableCell></TableRow>
              )}
              {filtradas.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(m.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-xs font-medium">{m.materiais?.nome || '—'}</TableCell>
                  <TableCell className="text-xs">{tipoBadge(m.tipo)}</TableCell>
                  <TableCell className="text-xs text-right">{Number(m.quantidade)} {m.materiais?.unidade || ''}</TableCell>
                  <TableCell className="text-xs">
                    {m.motivo || '—'}
                    {m.observacao && <div className="text-[11px] text-muted-foreground">{m.observacao}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{m.servico_id ? 'Serviço executado' : 'Manual'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MovimentacaoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        materiais={materiais}
        tipoInicial={tipoInicial}
        onSaved={() => { fetchData(); onChanged?.() }}
      />
    </div>
  )
}
