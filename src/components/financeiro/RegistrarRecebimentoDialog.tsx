import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { sbFin, FORMAS_PAGAMENTO, fmtBRL, useInvalidarFinanceiro, type ContaOS } from '@/hooks/useFinanceiro'

export default function RegistrarRecebimentoDialog({ conta, onClose }: { conta: ContaOS | null; onClose: () => void }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const invalidar = useInvalidarFinanceiro()
  const [data, setData] = useState('')
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState('Pix')
  const [obs, setObs] = useState('')
  const [isento, setIsento] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!conta) return
    setData(new Date().toLocaleDateString('sv-SE'))
    setValor(conta.saldo > 0 ? conta.saldo.toFixed(2).replace('.', ',') : '')
    const f = FORMAS_PAGAMENTO.find((x) => x.toLowerCase() === (conta.formaInformada ?? '').toLowerCase())
    setForma(f ?? 'Pix')
    setObs(''); setIsento(conta.isento); setMotivo(conta.motivoIsencao ?? '')
  }, [conta])

  const salvar = async () => {
    if (!conta) return
    setSalvando(true)
    try {
      if (isento !== conta.isento || (isento && motivo !== (conta.motivoIsencao ?? ''))) {
        if (isento && !motivo.trim()) throw new Error('Informe o motivo da isenção.')
        const { error } = await sbFin.from('financeiro_situacao_os').upsert({
          servico_id: conta.id, isento, motivo_isencao: isento ? motivo.trim() : null, atualizado_por: user?.id, updated_at: new Date().toISOString(),
        })
        if (error) throw error
      }
      if (!isento) {
        const v = Number(valor.replace(/\./g, '').replace(',', '.'))
        if (!v || v <= 0) throw new Error('Informe um valor válido.')
        const { error } = await sbFin.from('financeiro_recebimentos').insert({
          servico_id: conta.id, data_pagamento: data, valor: v, forma_pagamento: forma, observacao: obs.trim() || null, criado_por: user?.id,
        })
        if (error) throw error
      }
      toast({ title: 'Financeiro atualizado' })
      invalidar(); onClose()
    } catch (e) {
      toast({ title: 'Não foi possível salvar', description: (e as Error).message, variant: 'destructive' })
    } finally { setSalvando(false) }
  }

  return (
    <Dialog open={!!conta} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar recebimento — {conta?.protocolo}</DialogTitle></DialogHeader>
        {conta && (
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted p-3 text-xs space-y-1">
              <div>{conta.condominio} {conta.unidade} — {conta.morador}</div>
              <div>Valor: <b>{fmtBRL(conta.valor)}</b> · Recebido: <b>{fmtBRL(conta.recebido)}</b> · Saldo: <b>{fmtBRL(conta.saldo)}</b></div>
              {conta.formaInformada && <div>Informado pelo técnico: {conta.formaInformada}</div>}
            </div>
            <label className="flex items-center gap-2 text-xs"><Checkbox checked={isento} onCheckedChange={(v) => setIsento(!!v)} /> Marcar como isento (sem cobrança)</label>
            {isento ? (
              <div><Label className="text-xs">Motivo da isenção</Label><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Data do pagamento</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
                  <div><Label className="text-xs">Valor (R$)</Label><Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" /></div>
                </div>
                <div><Label className="text-xs">Forma de pagamento</Label>
                  <Select value={forma} onValueChange={setForma}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Observação</Label><Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
