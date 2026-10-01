import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { type Armazem, type MaterialSaldo, fmtQtd, sbEstoque } from '@/hooks/useEstoque'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  materiais: MaterialSaldo[]
  armazens: Armazem[]
}

export default function TransferirDialog({ open, onOpenChange, materiais, armazens }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [f, setF] = useState({ material_id: '', origem: '', destino: '', quantidade: '', observacao: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { if (open) setF({ material_id: '', origem: '', destino: '', quantidade: '', observacao: '' }) }, [open])

  const mat = materiais.find((m) => m.id === f.material_id)
  const saldoOrigem = mat && f.origem ? mat.porArmazem[f.origem] ?? 0 : null

  const salvar = async () => {
    const qtd = Number(f.quantidade.replace(',', '.'))
    if (!f.material_id || !f.origem || !f.destino) return toast({ title: 'Preencha material, origem e destino', variant: 'destructive' })
    if (f.origem === f.destino) return toast({ title: 'Origem e destino devem ser diferentes', variant: 'destructive' })
    if (!Number.isFinite(qtd) || qtd <= 0) return toast({ title: 'Informe uma quantidade válida', variant: 'destructive' })
    if (saldoOrigem !== null && qtd > saldoOrigem &&
      !window.confirm(`O saldo na origem é ${fmtQtd(saldoOrigem)} ${mat?.unidade}. Transferir mesmo assim?`)) return
    setSalvando(true)
    const { error } = await sbEstoque.rpc('transferir_estoque', {
      _material_id: f.material_id, _origem: f.origem, _destino: f.destino, _quantidade: qtd,
      _observacao: f.observacao.trim() || null,
    })
    setSalvando(false)
    if (error) return toast({ title: 'Erro na transferência', description: error.message, variant: 'destructive' })
    toast({ title: 'Transferência registrada' })
    onOpenChange(false)
    qc.invalidateQueries({ queryKey: ['estoque'] })
  }

  const ativos = armazens.filter((a) => a.ativo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Transferir entre armazéns</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label>Material</Label>
            <Select value={f.material_id} onValueChange={(v) => setF({ ...f, material_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {materiais.filter((m) => m.ativo).map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Origem</Label>
            <Select value={f.origem} onValueChange={(v) => setF({ ...f, origem: v })}>
              <SelectTrigger><SelectValue placeholder="De" /></SelectTrigger>
              <SelectContent>{ativos.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Destino</Label>
            <Select value={f.destino} onValueChange={(v) => setF({ ...f, destino: v })}>
              <SelectTrigger><SelectValue placeholder="Para" /></SelectTrigger>
              <SelectContent>{ativos.filter((a) => a.id !== f.origem).map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Quantidade{mat ? ` (${mat.unidade})` : ''}{saldoOrigem !== null ? ` — saldo na origem: ${fmtQtd(saldoOrigem)}` : ''}</Label>
            <Input inputMode="decimal" value={f.quantidade} onChange={(e) => setF({ ...f, quantidade: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Observação</Label>
            <Textarea rows={2} value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Transferir'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
