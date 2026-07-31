import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface MaterialForm {
  id?: string
  nome: string
  descricao: string
  unidade: string
  categoria: string
  estoque_minimo: number
  ativo: boolean
}

const EMPTY: MaterialForm = {
  nome: '',
  descricao: '',
  unidade: 'un',
  categoria: '',
  estoque_minimo: 0,
  ativo: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  material?: MaterialForm | null
  onSaved: () => void
}

export default function MaterialDialog({ open, onOpenChange, material, onSaved }: Props) {
  const { toast } = useToast()
  const [form, setForm] = useState<MaterialForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(material ? { ...material } : EMPTY)
  }, [open, material])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.nome.trim().length < 2) {
      toast({ title: 'Informe o nome do material', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao?.trim() || null,
      unidade: form.unidade?.trim() || 'un',
      categoria: form.categoria?.trim() || null,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      ativo: form.ativo,
    }

    const { error } = form.id
      ? await supabase.from('materiais').update(payload).eq('id', form.id)
      : await supabase.from('materiais').insert(payload)

    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao salvar material', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: form.id ? 'Material atualizado' : 'Material cadastrado' })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Editar material' : 'Novo material'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Mangueira 1/2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Input value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} placeholder="un, m, kg" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Hidráulica" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Estoque mínimo</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.estoque_minimo}
              onChange={e => setForm({ ...form, estoque_minimo: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="mb-0">Material ativo</Label>
            <Switch checked={form.ativo} onCheckedChange={v => setForm({ ...form, ativo: v })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
