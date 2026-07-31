import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface MaterialOption {
  id: string
  nome: string
  unidade: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  materiais: MaterialOption[]
  tipoInicial?: 'entrada' | 'saida' | 'ajuste'
  onSaved: () => void
}

export default function MovimentacaoDialog({ open, onOpenChange, materiais, tipoInicial = 'entrada', onSaved }: Props) {
  const { toast } = useToast()
  const [materialId, setMaterialId] = useState('')
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'ajuste'>(tipoInicial)
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setMaterialId('')
      setTipo(tipoInicial)
      setQuantidade('')
      setMotivo('')
      setObservacao('')
    }
  }, [open, tipoInicial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qtd = parseFloat(quantidade.replace(',', '.'))
    if (!materialId) {
      toast({ title: 'Selecione o material', variant: 'destructive' })
      return
    }
    if (!qtd || qtd <= 0) {
      toast({ title: 'Informe uma quantidade válida', variant: 'destructive' })
      return
    }

    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('estoque_movimentacoes').insert({
      material_id: materialId,
      tipo,
      quantidade: qtd,
      motivo: motivo.trim() || null,
      observacao: observacao.trim() || null,
      criado_por: userData?.user?.id ?? null,
    })
    setSaving(false)

    if (error) {
      toast({ title: 'Erro ao registrar movimentação', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Movimentação registrada' })
    onOpenChange(false)
    onSaved()
  }

  const unidade = materiais.find(m => m.id === materialId)?.unidade

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimentação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {materiais.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v: 'entrada' | 'saida' | 'ajuste') => setTipo(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade {unidade ? `(${unidade})` : ''}</Label>
              <Input inputMode="decimal" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Compra, devolução, perda..." />
          </div>

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
