import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { fmtQtd, sbEstoque, useArmazens, useMateriaisSaldo, useReceitas } from '@/hooks/useEstoque'

interface OS {
  id: string
  numero_protocolo: string | null
  condominio_nome_original: string
  bloco: string | null
  apartamento: string | null
  morador_nome: string | null
  tipo_servico: string
  status_atendimento: string
  uf: string
}
interface Item { material_id: string; quantidade: string }

const MOTIVOS = ['Perda', 'Avaria', 'Empréstimo', 'Uso interno', 'Outro']
const descOS = (o: OS) => [o.condominio_nome_original, o.bloco && `Bl ${o.bloco}`, o.apartamento && `Ap ${o.apartamento}`].filter(Boolean).join(' · ')

export default function BaixaManualTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: armazens = [] } = useArmazens(true)
  const { data: materiais = [] } = useMateriaisSaldo(true)
  const { data: receitas = [] } = useReceitas(true)
  const armAtivos = armazens.filter((a) => a.ativo)
  const mapaMat = useMemo(() => new Map(materiais.map((m) => [m.id, m])), [materiais])

  const [modo, setModo] = useState<'os' | 'avulsa'>('os')
  const [busca, setBusca] = useState('')
  const [termo, setTermo] = useState('')
  const [os, setOs] = useState<OS | null>(null)
  const [armazemId, setArmazemId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacao, setObservacao] = useState('')
  const [itens, setItens] = useState<Item[]>([])
  const [novoMat, setNovoMat] = useState('')
  const [novaQtd, setNovaQtd] = useState('1')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { const t = setTimeout(() => setTermo(busca.trim()), 300); return () => clearTimeout(t) }, [busca])

  const { data: resultados = [], isFetching } = useQuery({
    queryKey: ['estoque', 'busca-os', termo],
    enabled: modo === 'os' && !os && termo.length >= 2,
    queryFn: async () => {
      const t = termo.replace(/[%,()]/g, ' ')
      const { data, error } = await supabase.from('servicos_nacional_gas')
        .select('id, numero_protocolo, condominio_nome_original, bloco, apartamento, morador_nome, tipo_servico, status_atendimento, uf')
        .or(`numero_protocolo.ilike.%${t}%,condominio_nome_original.ilike.%${t}%,bloco.ilike.%${t}%,apartamento.ilike.%${t}%,morador_nome.ilike.%${t}%`)
        .order('created_at', { ascending: false }).limit(20)
      if (error) throw error
      return (data ?? []) as OS[]
    },
  })

  const { data: jaBaixado = [] } = useQuery({
    queryKey: ['estoque', 'baixas-os', os?.id],
    enabled: !!os,
    queryFn: async () => {
      const { data, error } = await sbEstoque.from('estoque_movimentacoes').select('material_id, quantidade').eq('servico_id', os!.id).eq('tipo', 'saida')
      if (error) throw error
      return (data ?? []) as { material_id: string; quantidade: number }[]
    },
  })

  const { data: ultimas = [] } = useQuery({
    queryKey: ['estoque', 'ultimas-baixas-manuais'],
    queryFn: async () => {
      const { data, error } = await sbEstoque.from('estoque_movimentacoes')
        .select('id, material_id, armazem_id, quantidade, motivo, created_at')
        .eq('tipo', 'saida').ilike('motivo', 'Baixa manual%').order('created_at', { ascending: false }).limit(10)
      if (error) throw error
      return (data ?? []) as { id: string; material_id: string; armazem_id: string; quantidade: number; motivo: string; created_at: string }[]
    },
  })

  const selecionarOS = (o: OS) => {
    setOs(o)
    const arm = armAtivos.find((a) => a.uf?.toUpperCase() === o.uf?.toUpperCase())
    if (arm) setArmazemId(arm.id)
    setItens(receitas.filter((r) => r.tipo_servico === o.tipo_servico).map((r) => ({ material_id: r.material_id, quantidade: String(r.quantidade) })))
  }

  const limpar = () => {
    setOs(null); setBusca(''); setItens([]); setMotivo(''); setObservacao(''); setNovoMat(''); setNovaQtd('1')
  }

  const adicionarItem = () => {
    if (!novoMat) return
    if (itens.some((i) => i.material_id === novoMat)) return toast({ title: 'Material já está na lista', variant: 'destructive' })
    setItens([...itens, { material_id: novoMat, quantidade: novaQtd }]); setNovoMat(''); setNovaQtd('1')
  }

  const confirmar = async () => {
    if (modo === 'os' && !os) return toast({ title: 'Selecione a OS', variant: 'destructive' })
    if (modo === 'avulsa' && !motivo) return toast({ title: 'Informe o motivo da saída', variant: 'destructive' })
    if (!armazemId) return toast({ title: 'Selecione o armazém', variant: 'destructive' })
    if (itens.length === 0) return toast({ title: 'Adicione ao menos um material', variant: 'destructive' })
    const linhas = itens.map((i) => ({ ...i, q: Number(i.quantidade.replace(',', '.')) }))
    if (linhas.some((l) => !Number.isFinite(l.q) || l.q <= 0)) return toast({ title: 'Há quantidade inválida', variant: 'destructive' })
    const acima = linhas.filter((l) => l.q > (mapaMat.get(l.material_id)?.porArmazem[armazemId] ?? 0))
    if (acima.length && !window.confirm(`${acima.map((l) => mapaMat.get(l.material_id)?.nome).join(', ')} ficará com saldo negativo neste armazém. Confirmar mesmo assim?`)) return
    if (os && jaBaixado.length && !window.confirm('Esta OS já tem saídas registradas. Confirmar nova baixa?')) return

    setSalvando(true)
    const { data: sess } = await supabase.auth.getSession()
    const mot = modo === 'os' ? `Baixa manual - OS ${os!.numero_protocolo ?? ''}`.trim() : `Baixa manual: ${motivo}`
    const { error } = await sbEstoque.from('estoque_movimentacoes').insert(linhas.map((l) => ({
      material_id: l.material_id, armazem_id: armazemId, tipo: 'saida', quantidade: l.q, motivo: mot,
      servico_id: modo === 'os' ? os!.id : null, observacao: observacao.trim() || null, criado_por: sess.session?.user?.id ?? null,
    })))
    setSalvando(false)
    if (error) return toast({ title: 'Erro ao registrar baixa', description: error.message, variant: 'destructive' })
    toast({ title: `Baixa registrada (${linhas.length} ${linhas.length === 1 ? 'item' : 'itens'})` })
    limpar()
    qc.invalidateQueries({ queryKey: ['estoque'] })
  }

  const nomeArm = (id: string) => armazens.find((a) => a.id === id)?.nome ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={modo === 'os' ? 'default' : 'outline'} onClick={() => { setModo('os'); limpar() }}>Vincular a uma OS</Button>
        <Button size="sm" variant={modo === 'avulsa' ? 'default' : 'outline'} onClick={() => { setModo('avulsa'); limpar() }}>Saída avulsa (sem OS)</Button>
      </div>

      {modo === 'os' && (
        os ? (
          <div className="rounded-md border p-3 flex items-start justify-between gap-2">
            <div className="text-sm space-y-0.5">
              <div className="font-semibold">{os.numero_protocolo ?? 'Sem protocolo'} <Badge variant="outline" className="ml-1">{os.status_atendimento}</Badge></div>
              <div>{descOS(os)} · {os.uf}</div>
              <div className="text-xs text-muted-foreground">{os.tipo_servico}{os.morador_nome ? ` · ${os.morador_nome}` : ''}</div>
              {jaBaixado.length > 0 && (
                <div className="text-xs text-destructive pt-1">
                  Já saiu para esta OS: {jaBaixado.map((b) => `${mapaMat.get(b.material_id)?.nome ?? '?'} ${fmtQtd(Number(b.quantidade))}`).join(', ')}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={limpar} aria-label="Trocar OS"><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="h-9 pl-8" placeholder="Protocolo, condomínio, bloco, apto ou morador" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            {termo.length >= 2 && (
              <div className="rounded-md border divide-y max-h-72 overflow-y-auto">
                {isFetching ? <div className="p-3 text-xs text-muted-foreground">Buscando...</div>
                  : resultados.length === 0 ? <div className="p-3 text-xs text-muted-foreground">Nenhuma OS encontrada.</div>
                  : resultados.map((o) => (
                    <button key={o.id} className="w-full text-left p-2 text-xs hover:bg-muted" onClick={() => selecionarOS(o)}>
                      <span className="font-semibold">{o.numero_protocolo ?? '—'}</span> · {descOS(o)} · {o.uf}
                      <span className="text-muted-foreground"> · {o.tipo_servico} · {o.status_atendimento}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )
      )}

      {(modo === 'avulsa' || os) && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Armazém</Label>
              <Select value={armazemId} onValueChange={setArmazemId}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{armAtivos.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}{a.uf ? ` (${a.uf})` : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {modo === 'avulsa' && (
              <div className="space-y-1">
                <Label className="text-xs">Motivo</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{MOTIVOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Observação</Label>
              <Input className="h-9" value={observacao} maxLength={200} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Material</Label>
              <Select value={novoMat} onValueChange={setNovoMat}>
                <SelectTrigger className="h-9 w-[240px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{materiais.filter((m) => m.ativo).map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <Input className="h-9 w-[100px]" inputMode="decimal" value={novaQtd} onChange={(e) => setNovaQtd(e.target.value)} />
            </div>
            <Button size="sm" variant="outline" onClick={adicionarItem}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="text-xs">
              <TableHeader><TableRow>
                <TableHead className="h-9">Material</TableHead>
                <TableHead className="h-9 w-[140px]">Quantidade</TableHead>
                <TableHead className="h-9 text-right">Saldo no armazém</TableHead>
                <TableHead className="h-9 w-10" />
              </TableRow></TableHeader>
              <TableBody>
                {itens.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum material adicionado.</TableCell></TableRow>
                ) : itens.map((i, idx) => {
                  const m = mapaMat.get(i.material_id)
                  const saldo = armazemId ? m?.porArmazem[armazemId] ?? 0 : null
                  const q = Number(i.quantidade.replace(',', '.'))
                  return (
                    <TableRow key={i.material_id}>
                      <TableCell className="font-medium">{m?.nome ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input className="h-7 w-20 text-xs" inputMode="decimal" value={i.quantidade}
                            onChange={(e) => setItens(itens.map((x, j) => j === idx ? { ...x, quantidade: e.target.value } : x))} />
                          <span className="text-muted-foreground">{m?.unidade}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right ${saldo !== null && q > saldo ? 'text-destructive font-semibold' : ''}`}>{saldo === null ? '—' : fmtQtd(saldo)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setItens(itens.filter((_, j) => j !== idx))} aria-label="Remover"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={limpar}>Limpar</Button>
            <Button size="sm" onClick={confirmar} disabled={salvando}>{salvando ? 'Salvando...' : 'Confirmar baixa'}</Button>
          </div>
        </>
      )}

      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Últimas baixas manuais</h4>
        <div className="rounded-md border overflow-x-auto">
          <Table className="text-xs">
            <TableHeader><TableRow>
              <TableHead className="h-9">Data</TableHead><TableHead className="h-9">Material</TableHead>
              <TableHead className="h-9">Armazém</TableHead><TableHead className="h-9 text-right">Qtd</TableHead><TableHead className="h-9">Motivo</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ultimas.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Nenhuma baixa manual ainda.</TableCell></TableRow>
              ) : ultimas.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{new Date(u.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                  <TableCell>{mapaMat.get(u.material_id)?.nome ?? '—'}</TableCell>
                  <TableCell>{nomeArm(u.armazem_id)}</TableCell>
                  <TableCell className="text-right">{fmtQtd(Number(u.quantidade))}</TableCell>
                  <TableCell>{u.motivo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
