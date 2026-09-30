import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { fmtQtd, useMateriaisSaldo, useMovimentacoes } from '@/hooks/useEstoque'

type Tipo = 'entrada' | 'saida' | 'ajuste'
const rotulo: Record<Tipo, string> = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' }

export default function MovimentacoesTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const [inicio, setInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [fim, setFim] = useState(hoje)
  const [filtroMaterial, setFiltroMaterial] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const { data: materiais = [] } = useMateriaisSaldo(true)
  const { data: movs = [], isLoading } = useMovimentacoes(true, { inicio, fim })

  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ material_id: '', tipo: 'entrada' as Tipo, quantidade: '', motivo: '', observacao: '' })

  const ativos = materiais.filter((m) => m.ativo)
  const selecionado = materiais.find((m) => m.id === form.material_id)

  const lista = useMemo(() => movs.filter((m) =>
    (filtroMaterial === 'todos' || m.material_id === filtroMaterial) &&
    (filtroTipo === 'todos' || m.tipo === filtroTipo)), [movs, filtroMaterial, filtroTipo])

  const abrir = () => {
    setForm({ material_id: '', tipo: 'entrada', quantidade: '', motivo: '', observacao: '' })
    setAberto(true)
  }

  const salvar = async () => {
    const qtd = Number(form.quantidade.replace(',', '.'))
    if (!form.material_id) return toast({ title: 'Selecione o material', variant: 'destructive' })
    if (!Number.isFinite(qtd) || qtd === 0) return toast({ title: 'Informe uma quantidade válida', variant: 'destructive' })
    if (form.tipo !== 'ajuste' && qtd < 0) return toast({ title: 'Use valores positivos para entrada e saída', variant: 'destructive' })
    if (form.tipo === 'ajuste' && !form.motivo.trim()) return toast({ title: 'Informe o motivo do ajuste', variant: 'destructive' })
    if (form.tipo === 'saida' && selecionado && qtd > selecionado.saldo) {
      if (!window.confirm(`O saldo atual é ${fmtQtd(selecionado.saldo)} ${selecionado.unidade}. Registrar a saída mesmo assim?`)) return
    }
    setSalvando(true)
    const { data: sess } = await supabase.auth.getSession()
    const { error } = await supabase.from('estoque_movimentacoes').insert({
      material_id: form.material_id,
      tipo: form.tipo,
      quantidade: qtd,
      motivo: form.motivo.trim() || null,
      observacao: form.observacao.trim() || null,
      criado_por: sess.session?.user?.id ?? null,
    })
    setSalvando(false)
    if (error) return toast({ title: 'Erro ao registrar movimentação', description: error.message, variant: 'destructive' })
    toast({ title: `${rotulo[form.tipo]} registrada` })
    setAberto(false)
    qc.invalidateQueries({ queryKey: ['estoque'] })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" className="h-9 w-[150px]" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" className="h-9 w-[150px]" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Material</Label>
          <Select value={filtroMaterial} onValueChange={setFiltroMaterial}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {materiais.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
              <SelectItem value="ajuste">Ajuste</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={abrir} disabled={ativos.length === 0}><Plus className="h-4 w-4 mr-1" /> Nova movimentação</Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-9">Data/hora</TableHead>
              <TableHead className="h-9">Tipo</TableHead>
              <TableHead className="h-9">Material</TableHead>
              <TableHead className="h-9 text-right">Quantidade</TableHead>
              <TableHead className="h-9">Motivo</TableHead>
              <TableHead className="h-9">OS</TableHead>
              <TableHead className="h-9">Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : lista.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhuma movimentação no período.</TableCell></TableRow>
            ) : lista.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap">{format(new Date(m.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>
                  <Badge variant={m.tipo === 'entrada' ? 'secondary' : m.tipo === 'saida' ? 'destructive' : 'outline'}>{rotulo[m.tipo]}</Badge>
                </TableCell>
                <TableCell className="font-medium">{m.material_nome}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {m.tipo === 'saida' ? '−' : m.tipo === 'entrada' ? '+' : m.quantidade > 0 ? '+' : ''}{fmtQtd(m.tipo === 'saida' ? m.quantidade : m.quantidade)} {m.material_unidade}
                </TableCell>
                <TableCell>{m.motivo ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap">{m.protocolo ?? '—'}</TableCell>
                <TableCell className="max-w-[240px] truncate" title={m.observacao ?? ''}>{m.observacao ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova movimentação</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Material</Label>
              <Select value={form.material_id} onValueChange={(v) => setForm({ ...form, material_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ativos.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} — saldo {fmtQtd(m.saldo)} {m.unidade}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Tipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste (+/−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantidade{selecionado ? ` (${selecionado.unidade})` : ''}</Label>
              <Input inputMode="decimal" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                placeholder={form.tipo === 'ajuste' ? 'Ex.: -2 ou 5' : 'Ex.: 10'} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Motivo{form.tipo === 'ajuste' ? ' (obrigatório)' : ''}</Label>
              <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} maxLength={150}
                placeholder={form.tipo === 'entrada' ? 'Ex.: Compra NF 1234' : form.tipo === 'saida' ? 'Ex.: Retirada para equipe' : 'Ex.: Inventário'} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Observação</Label>
              <Textarea rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
