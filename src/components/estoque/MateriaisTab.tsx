import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { fmtQtd, type MaterialSaldo, useMateriaisSaldo } from '@/hooks/useEstoque'

const vazio = { nome: '', unidade: 'un', categoria: '', estoque_minimo: '0', descricao: '', ativo: true }

export default function MateriaisTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: materiais = [], isLoading } = useMateriaisSaldo(true)
  const [busca, setBusca] = useState('')
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase()
    return materiais.filter((m) =>
      (mostrarInativos || m.ativo) &&
      (!b || m.nome.toLowerCase().includes(b) || (m.categoria ?? '').toLowerCase().includes(b)))
  }, [materiais, busca, mostrarInativos])

  const abaixo = materiais.filter((m) => m.ativo && m.saldo < m.estoque_minimo).length

  const abrirNovo = () => { setEditId(null); setForm(vazio); setAberto(true) }
  const abrirEditar = (m: MaterialSaldo) => {
    setEditId(m.id)
    setForm({
      nome: m.nome, unidade: m.unidade, categoria: m.categoria ?? '',
      estoque_minimo: String(m.estoque_minimo), descricao: m.descricao ?? '', ativo: m.ativo,
    })
    setAberto(true)
  }

  const salvar = async () => {
    const nome = form.nome.trim()
    const minimo = Number(form.estoque_minimo.replace(',', '.'))
    if (nome.length < 2) return toast({ title: 'Informe o nome do material', variant: 'destructive' })
    if (!form.unidade.trim()) return toast({ title: 'Informe a unidade', variant: 'destructive' })
    if (!Number.isFinite(minimo) || minimo < 0) return toast({ title: 'Estoque mínimo inválido', variant: 'destructive' })
    setSalvando(true)
    const payload = {
      nome, unidade: form.unidade.trim(), categoria: form.categoria.trim() || null,
      estoque_minimo: minimo, descricao: form.descricao.trim() || null, ativo: form.ativo,
    }
    const { error } = editId
      ? await supabase.from('materiais').update(payload).eq('id', editId)
      : await supabase.from('materiais').insert(payload)
    setSalvando(false)
    if (error) return toast({ title: 'Erro ao salvar material', description: error.message, variant: 'destructive' })
    toast({ title: editId ? 'Material atualizado' : 'Material cadastrado' })
    setAberto(false)
    qc.invalidateQueries({ queryKey: ['estoque'] })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Buscar material ou categoria" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={mostrarInativos} onCheckedChange={setMostrarInativos} /> Mostrar inativos
        </label>
        <Button size="sm" onClick={abrirNovo}><Plus className="h-4 w-4 mr-1" /> Novo material</Button>
      </div>

      {abaixo > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {abaixo} {abaixo === 1 ? 'material está' : 'materiais estão'} abaixo do estoque mínimo.
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-9">Material</TableHead>
              <TableHead className="h-9">Categoria</TableHead>
              <TableHead className="h-9">Unidade</TableHead>
              <TableHead className="h-9 text-right">Saldo</TableHead>
              <TableHead className="h-9 text-right">Mínimo</TableHead>
              <TableHead className="h-9">Situação</TableHead>
              <TableHead className="h-9 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : lista.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhum material cadastrado.</TableCell></TableRow>
            ) : lista.map((m) => {
              const baixo = m.ativo && m.saldo < m.estoque_minimo
              return (
                <TableRow key={m.id} className={!m.ativo ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell>{m.categoria ?? '—'}</TableCell>
                  <TableCell>{m.unidade}</TableCell>
                  <TableCell className={`text-right font-semibold ${baixo ? 'text-destructive' : ''}`}>{fmtQtd(m.saldo)}</TableCell>
                  <TableCell className="text-right">{fmtQtd(m.estoque_minimo)}</TableCell>
                  <TableCell>
                    {!m.ativo ? <Badge variant="outline">Inativo</Badge>
                      : baixo ? <Badge variant="destructive">Abaixo do mínimo</Badge>
                      : <Badge variant="secondary">OK</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEditar(m)} aria-label="Editar material">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Editar material' : 'Novo material'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="un, m, kg..." maxLength={20} />
            </div>
            <div className="space-y-1">
              <Label>Estoque mínimo</Label>
              <Input inputMode="decimal" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} maxLength={60} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} maxLength={500} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /> Ativo
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
