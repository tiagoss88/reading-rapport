import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, AlertTriangle, Trash2, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

type Material = {
  id: string
  nome: string
  descricao: string | null
  unidade: string
  categoria: string | null
  estoque_minimo: number
  ativo: boolean
}
type Saldo = { material_id: string; nome: string; unidade: string; categoria: string | null; estoque_minimo: number; ativo: boolean; saldo: number }
type Movimentacao = {
  id: string; material_id: string; tipo: 'entrada' | 'saida' | 'ajuste'; quantidade: number
  motivo: string | null; observacao: string | null; created_at: string; servico_id: string | null
  materiais?: { nome: string; unidade: string } | null
}
type Receita = { id: string; tipo_servico: string; material_id: string; quantidade: number; materiais?: { nome: string; unidade: string } | null }

export default function Estoque() {
  return (
    <Layout title="Estoque">
      <Tabs defaultValue="materiais" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="receitas">Receitas por serviço</TabsTrigger>
        </TabsList>
        <TabsContent value="materiais"><MateriaisTab /></TabsContent>
        <TabsContent value="movimentacoes"><MovimentacoesTab /></TabsContent>
        <TabsContent value="receitas"><ReceitasTab /></TabsContent>
      </Tabs>
    </Layout>
  )
}

// ---------- Materiais ----------
function MateriaisTab() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)

  const { data: saldos = [], isLoading } = useQuery({
    queryKey: ['estoque-saldos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('v_estoque_saldo').select('*').order('nome')
      if (error) throw error
      return (data ?? []) as Saldo[]
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('materiais').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque-saldos'] })
      toast({ title: 'Material removido' })
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-2" />Novo material</Button>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Carregando...</TableCell></TableRow>}
            {!isLoading && saldos.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhum material cadastrado</TableCell></TableRow>}
            {saldos.map(s => {
              const baixo = Number(s.saldo) < Number(s.estoque_minimo)
              return (
                <TableRow key={s.material_id} className="text-xs">
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell>{s.categoria || '-'}</TableCell>
                  <TableCell>{s.unidade}</TableCell>
                  <TableCell className="text-right font-mono">{Number(s.saldo).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-mono">{Number(s.estoque_minimo).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    {!s.ativo ? <Badge variant="secondary">Inativo</Badge>
                      : baixo ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Baixo</Badge>
                      : <Badge variant="outline">OK</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={async () => {
                      const { data } = await (supabase as any).from('materiais').select('*').eq('id', s.material_id).single()
                      setEditing(data as Material); setDialogOpen(true)
                    }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => confirm(`Remover ${s.nome}?`) && remove.mutate(s.material_id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <MaterialDialog open={dialogOpen} onOpenChange={setDialogOpen} material={editing} />
    </div>
  )
}

function MaterialDialog({ open, onOpenChange, material }: { open: boolean; onOpenChange: (v: boolean) => void; material: Material | null }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState({ nome: '', descricao: '', unidade: 'un', categoria: '', estoque_minimo: 0, ativo: true })

  useState(() => { /* placeholder to satisfy React 18 rules */ })

  // sync when opens
  if (open && material && form.nome !== material.nome) {
    setForm({
      nome: material.nome, descricao: material.descricao ?? '', unidade: material.unidade,
      categoria: material.categoria ?? '', estoque_minimo: Number(material.estoque_minimo), ativo: material.ativo,
    })
  }
  if (open && !material && form.nome !== '') {
    // reset if opening for new
    // no-op — reset happens on close below
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error('Nome obrigatório')
      const payload = { ...form, categoria: form.categoria || null, descricao: form.descricao || null }
      if (material) {
        const { error } = await (supabase as any).from('materiais').update(payload).eq('id', material.id)
        if (error) throw error
      } else {
        const { error } = await (supabase as any).from('materiais').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estoque-saldos'] })
      toast({ title: material ? 'Material atualizado' : 'Material criado' })
      onOpenChange(false)
      setForm({ nome: '', descricao: '', unidade: 'un', categoria: '', estoque_minimo: 0, ativo: true })
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setForm({ nome: '', descricao: '', unidade: 'un', categoria: '', estoque_minimo: 0, ativo: true }) }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{material ? 'Editar material' : 'Novo material'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Unidade</Label>
              <Select value={form.unidade} onValueChange={v => setForm({ ...form, unidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['un', 'm', 'kg', 'L', 'pç', 'cx'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label><Input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} /></div>
          </div>
          <div><Label>Estoque mínimo</Label><Input type="number" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: Number(e.target.value) })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Movimentações ----------
function MovimentacoesTab() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ material_id: '', tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste', quantidade: 0, motivo: '', observacao: '' })

  const { data: materiais = [] } = useQuery({
    queryKey: ['materiais-list'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('materiais').select('id,nome,unidade').eq('ativo', true).order('nome')
      if (error) throw error
      return data as Array<{ id: string; nome: string; unidade: string }>
    },
  })

  const { data: movs = [], isLoading } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('estoque_movimentacoes')
        .select('*, materiais(nome, unidade)').order('created_at', { ascending: false }).limit(200)
      if (error) throw error
      return data as Movimentacao[]
    },
  })

  const criar = useMutation({
    mutationFn: async () => {
      if (!form.material_id) throw new Error('Selecione um material')
      if (!form.quantidade) throw new Error('Quantidade obrigatória')
      const user = (await supabase.auth.getUser()).data.user
      const { error } = await (supabase as any).from('estoque_movimentacoes').insert({
        ...form, motivo: form.motivo || null, observacao: form.observacao || null, criado_por: user?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimentacoes'] })
      qc.invalidateQueries({ queryKey: ['estoque-saldos'] })
      toast({ title: 'Movimentação registrada' })
      setOpen(false)
      setForm({ material_id: '', tipo: 'entrada', quantidade: 0, motivo: '', observacao: '' })
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova movimentação</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova movimentação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Material</Label>
                <Select value={form.material_id} onValueChange={v => setForm({ ...form, material_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{materiais.map(m => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v: any) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Motivo</Label><Input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Ex: Compra NF 123, uso interno..." /></div>
              <div><Label>Observação</Label><Textarea value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => criar.mutate()} disabled={criar.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              <TableHead>Data</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtde</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Vinculado a serviço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>}
            {!isLoading && movs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhuma movimentação</TableCell></TableRow>}
            {movs.map(m => (
              <TableRow key={m.id} className="text-xs">
                <TableCell>{format(new Date(m.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{m.materiais?.nome ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={m.tipo === 'entrada' ? 'default' : m.tipo === 'saida' ? 'destructive' : 'secondary'}>
                    {m.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{Number(m.quantidade).toLocaleString('pt-BR')} {m.materiais?.unidade}</TableCell>
                <TableCell>{m.motivo || '-'}</TableCell>
                <TableCell>{m.servico_id ? <Badge variant="outline">Sim</Badge> : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ---------- Receitas ----------
function ReceitasTab() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ tipo_servico: '', material_id: '', quantidade: 1 })

  const { data: tipos = [] } = useQuery({
    queryKey: ['tipos-servico'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('tipos_servico').select('nome').eq('ativo', true).order('nome')
      if (error) return [] as Array<{ nome: string }>
      return data as Array<{ nome: string }>
    },
  })
  const { data: materiais = [] } = useQuery({
    queryKey: ['materiais-list'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('materiais').select('id,nome,unidade').eq('ativo', true).order('nome')
      if (error) throw error
      return data as Array<{ id: string; nome: string; unidade: string }>
    },
  })

  const { data: receitas = [], isLoading } = useQuery({
    queryKey: ['receitas'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('tipo_servico_materiais')
        .select('*, materiais(nome, unidade)').order('tipo_servico')
      if (error) throw error
      return data as Receita[]
    },
  })

  const criar = useMutation({
    mutationFn: async () => {
      if (!form.tipo_servico || !form.material_id) throw new Error('Preencha todos os campos')
      const { error } = await (supabase as any).from('tipo_servico_materiais').insert(form)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receitas'] })
      toast({ title: 'Receita adicionada' })
      setOpen(false); setForm({ tipo_servico: '', material_id: '', quantidade: 1 })
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('tipo_servico_materiais').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receitas'] }),
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Configure quais materiais são debitados automaticamente quando um serviço é marcado como executado.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova receita</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova receita</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tipo de serviço</Label>
                {tipos.length > 0 ? (
                  <Select value={form.tipo_servico} onValueChange={v => setForm({ ...form, tipo_servico: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{tipos.map(t => <SelectItem key={t.nome} value={t.nome}>{t.nome}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={form.tipo_servico} onChange={e => setForm({ ...form, tipo_servico: e.target.value })} placeholder="Ex: Religação" />
                )}
              </div>
              <div><Label>Material</Label>
                <Select value={form.material_id} onValueChange={v => setForm({ ...form, material_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{materiais.map(m => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Quantidade consumida</Label><Input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => criar.mutate()} disabled={criar.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              <TableHead>Tipo de serviço</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>}
            {!isLoading && receitas.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhuma receita configurada</TableCell></TableRow>}
            {receitas.map(r => (
              <TableRow key={r.id} className="text-xs">
                <TableCell className="font-medium">{r.tipo_servico}</TableCell>
                <TableCell>{r.materiais?.nome ?? '-'}</TableCell>
                <TableCell className="text-right font-mono">{Number(r.quantidade).toLocaleString('pt-BR')} {r.materiais?.unidade}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => confirm('Remover?') && remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
