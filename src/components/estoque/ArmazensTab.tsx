import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { type Armazem, sbEstoque, useArmazens } from '@/hooks/useEstoque'

const vazio = { nome: '', uf: '', ativo: true }

export default function ArmazensTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: armazens = [], isLoading } = useArmazens()
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  const abrir = (a?: Armazem) => {
    setEditId(a?.id ?? null)
    setForm(a ? { nome: a.nome, uf: a.uf ?? '', ativo: a.ativo } : vazio)
    setAberto(true)
  }

  const salvar = async () => {
    const nome = form.nome.trim()
    const uf = form.uf.trim().toUpperCase()
    if (nome.length < 2) return toast({ title: 'Informe o nome do armazém', variant: 'destructive' })
    if (uf && !/^[A-Z]{2}$/.test(uf)) return toast({ title: 'UF deve ter 2 letras (ex.: BA)', variant: 'destructive' })
    if (form.ativo && uf && armazens.some((a) => a.id !== editId && a.ativo && (a.uf ?? '').toUpperCase() === uf)) {
      if (!window.confirm(`Já existe armazém ativo para ${uf}. As OS desse estado vão descontar do mais antigo. Continuar?`)) return
    }
    setSalvando(true)
    const payload = { nome, uf: uf || null, ativo: form.ativo }
    const { error } = editId
      ? await sbEstoque.from('armazens').update(payload).eq('id', editId)
      : await sbEstoque.from('armazens').insert(payload)
    setSalvando(false)
    if (error) return toast({ title: 'Erro ao salvar armazém', description: error.message, variant: 'destructive' })
    toast({ title: editId ? 'Armazém atualizado' : 'Armazém cadastrado' })
    setAberto(false)
    qc.invalidateQueries({ queryKey: ['estoque'] })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground flex-1">
          Ao fechar uma OS, os materiais saem do armazém ativo do mesmo estado (UF) da OS.
        </p>
        <Button size="sm" onClick={() => abrir()}><Plus className="h-4 w-4 mr-1" /> Novo armazém</Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-9">Armazém</TableHead>
              <TableHead className="h-9">UF</TableHead>
              <TableHead className="h-9">Situação</TableHead>
              <TableHead className="h-9 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : armazens.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum armazém cadastrado.</TableCell></TableRow>
            ) : armazens.map((a) => (
              <TableRow key={a.id} className={!a.ativo ? 'opacity-60' : ''}>
                <TableCell className="font-medium">{a.nome}</TableCell>
                <TableCell>{a.uf ?? '—'}</TableCell>
                <TableCell>{a.ativo ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrir(a)} aria-label="Editar armazém">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editId ? 'Editar armazém' : 'Novo armazém'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={80} placeholder="Ex.: Armazém BA" />
            </div>
            <div className="space-y-1">
              <Label>UF</Label>
              <Input value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })} maxLength={2} placeholder="BA" />
            </div>
            <label className="col-span-3 flex items-center gap-2 text-sm">
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
