import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { fmtQtd, useMateriaisSaldo, useReceitas, useTiposServicoNomes } from '@/hooks/useEstoque'

export default function ReceitasTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: tipos = [] } = useTiposServicoNomes(true)
  const { data: materiais = [] } = useMateriaisSaldo(true)
  const { data: receitas = [], isLoading } = useReceitas(true)

  const [tipo, setTipo] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [qtd, setQtd] = useState('1')
  const [salvando, setSalvando] = useState(false)

  const mapaMat = useMemo(() => new Map(materiais.map((m) => [m.id, m])), [materiais])
  const doTipo = receitas.filter((r) => r.tipo_servico === tipo)
  const disponiveis = materiais.filter((m) => m.ativo && !doTipo.some((r) => r.material_id === m.id))
  const contagem = useMemo(() => {
    const c = new Map<string, number>()
    receitas.forEach((r) => c.set(r.tipo_servico, (c.get(r.tipo_servico) ?? 0) + 1))
    return c
  }, [receitas])

  const adicionar = async () => {
    const q = Number(qtd.replace(',', '.'))
    if (!tipo || !materialId) return toast({ title: 'Selecione o tipo de serviço e o material', variant: 'destructive' })
    if (!Number.isFinite(q) || q <= 0) return toast({ title: 'Quantidade inválida', variant: 'destructive' })
    setSalvando(true)
    const { error } = await supabase.from('tipo_servico_materiais').insert({ tipo_servico: tipo, material_id: materialId, quantidade: q })
    setSalvando(false)
    if (error) return toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' })
    setMaterialId(''); setQtd('1')
    qc.invalidateQueries({ queryKey: ['estoque', 'receitas'] })
  }

  const atualizarQtd = async (id: string, valor: string) => {
    const q = Number(valor.replace(',', '.'))
    if (!Number.isFinite(q) || q <= 0) return toast({ title: 'Quantidade inválida', variant: 'destructive' })
    const { error } = await supabase.from('tipo_servico_materiais').update({ quantidade: q }).eq('id', id)
    if (error) return toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
    qc.invalidateQueries({ queryKey: ['estoque', 'receitas'] })
  }

  const remover = async (id: string) => {
    const { error } = await supabase.from('tipo_servico_materiais').delete().eq('id', id)
    if (error) return toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' })
    qc.invalidateQueries({ queryKey: ['estoque', 'receitas'] })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Defina os materiais usados em cada tipo de serviço. Quando a OS for marcada como executada, essas quantidades
        saem do estoque automaticamente (uma única vez por OS).
      </p>

      <div className="space-y-1 max-w-sm">
        <Label className="text-xs">Tipo de serviço</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Selecione o tipo de serviço" /></SelectTrigger>
          <SelectContent>
            {tipos.map((t) => (
              <SelectItem key={t} value={t}>{t}{contagem.get(t) ? ` (${contagem.get(t)})` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tipo && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Material</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger className="h-9 w-[240px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {disponiveis.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantidade por OS</Label>
              <Input className="h-9 w-[120px]" inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value)} />
            </div>
            <Button size="sm" onClick={adicionar} disabled={salvando || disponiveis.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9">Material</TableHead>
                  <TableHead className="h-9 w-[160px]">Quantidade por OS</TableHead>
                  <TableHead className="h-9 text-right">Saldo atual</TableHead>
                  <TableHead className="h-9 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : doTipo.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum material definido para este serviço.</TableCell></TableRow>
                ) : doTipo.map((r) => {
                  const m = mapaMat.get(r.material_id)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{m?.nome ?? '—'}{m && !m.ativo ? ' (inativo)' : ''}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input key={`${r.id}-${r.quantidade}`} className="h-7 w-20 text-xs" inputMode="decimal" defaultValue={String(r.quantidade)}
                            onBlur={(e) => { if (Number(e.target.value.replace(',', '.')) !== r.quantidade) void atualizarQtd(r.id, e.target.value) }} />
                          <span className="text-muted-foreground">{m?.unidade}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{m ? fmtQtd(m.saldo) : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remover(r.id)} aria-label="Remover material">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
