import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Loader2, AlertTriangle, FileDown, FileSpreadsheet, FileText } from 'lucide-react'
import Layout from '@/components/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  useFinanceiroInstalado, useFinanceiroDados, useInvalidarFinanceiro, sbFin, fmtBRL,
  SITUACAO_LABEL, FORMAS_PAGAMENTO, type ContaOS, type Situacao,
} from '@/hooks/useFinanceiro'
import RegistrarRecebimentoDialog from '@/components/financeiro/RegistrarRecebimentoDialog'
import { exportarEstoquePDF, exportarEstoqueExcel, exportarEstoqueCSV } from '@/lib/exportEstoque'
import type { Relatorio } from '@/hooks/useRelatoriosEstoque'

const fd = (d: string | null) => (d ? format(new Date(d.length === 10 ? d + 'T00:00:00' : d), 'dd/MM/yyyy') : '—')
const variante: Record<Situacao, 'default' | 'secondary' | 'destructive' | 'outline'> = { pago: 'default', parcial: 'secondary', pendente: 'destructive', isento: 'outline' }

function Exportar({ titulo, rel }: { titulo: string; rel: () => Relatorio }) {
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => exportarEstoquePDF(titulo, `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, rel())}><FileDown className="h-3 w-3 mr-1" />PDF</Button>
      <Button size="sm" variant="outline" onClick={() => exportarEstoqueExcel(titulo, rel())}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button>
      <Button size="sm" variant="outline" onClick={() => exportarEstoqueCSV(titulo, rel())}><FileText className="h-3 w-3 mr-1" />CSV</Button>
    </div>
  )
}

function Totais({ itens }: { itens: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {itens.map(([l, v]) => (
        <Card key={l}><CardContent className="p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="text-lg font-semibold">{v}</div></CardContent></Card>
      ))}
    </div>
  )
}

function Conteudo() {
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') ?? 'receber'
  const inst = useFinanceiroInstalado()
  const { data, isLoading, error } = useFinanceiroDados(inst.data === true)
  const { toast } = useToast()
  const { user } = useAuth()
  const invalidar = useInvalidarFinanceiro()

  const [busca, setBusca] = useState('')
  const [uf, setUf] = useState('todas')
  const [sit, setSit] = useState('abertas')
  const [ini, setIni] = useState('')
  const [fim, setFim] = useState('')
  const [formaF, setFormaF] = useState('todas')
  const [diasPend, setDiasPend] = useState('30')
  const [sel, setSel] = useState<ContaOS | null>(null)

  const ufs = useMemo(() => [...new Set((data?.contas ?? []).map((c) => c.uf).filter(Boolean))].sort(), [data])
  const noPeriodo = (d: string | null) => { if (!d) return !ini && !fim; const x = d.slice(0, 10); return (!ini || x >= ini) && (!fim || x <= fim) }
  const periodoAtivo = !!(ini || fim)
  const fmtPeriodo = (a: string, b: string) => `${a ? fd(a) : 'início'} – ${b ? fd(b) : 'hoje'}`
  const periodos = useMemo<[string, string, string][]>(() => {
    const d = new Date(); const y = d.getFullYear(); const m = d.getMonth()
    const f = (x: Date) => format(x, 'yyyy-MM-dd')
    return [
      ['Este mês', f(new Date(y, m, 1)), f(new Date(y, m + 1, 0))],
      ['Mês passado', f(new Date(y, m - 1, 1)), f(new Date(y, m, 0))],
      ['Últimos 30 dias', f(new Date(d.getTime() - 29 * 86400000)), f(d)],
      ['Este ano', f(new Date(y, 0, 1)), f(new Date(y, 11, 31))],
    ]
  }, [])
  const aplicarPeriodo = (a: string | null, b: string | null) => { setIni(a ?? ''); setFim(b ?? '') }

  const contas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (data?.contas ?? []).filter((c) =>
      (uf === 'todas' || c.uf === uf) &&
      (sit === 'todas' || (sit === 'abertas' ? c.situacao === 'pendente' || c.situacao === 'parcial' : c.situacao === sit)) &&
      noPeriodo(c.dataExecucao) &&
      (!q || [c.protocolo, c.condominio, c.morador, c.unidade].join(' ').toLowerCase().includes(q)))
  }, [data, busca, uf, sit, ini, fim]) // eslint-disable-line react-hooks/exhaustive-deps

  const recebs = useMemo(() => (data?.recebimentos ?? []).filter((r) => {
    const c = data?.contaMap.get(r.servico_id)
    return (formaF === 'todas' || r.forma_pagamento === formaF) && (uf === 'todas' || c?.uf === uf) && noPeriodo(r.data_pagamento)
  }), [data, formaF, uf, ini, fim]) // eslint-disable-line react-hooks/exhaustive-deps

  if (inst.isLoading || isLoading) return <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando financeiro...</div>
  if (inst.data === false) return (
    <Card><CardContent className="p-6 space-y-2">
      <p className="text-sm font-medium">O módulo financeiro ainda não foi ativado no banco de dados.</p>
      <p className="text-xs text-muted-foreground">Rode o script <b>supabase/manual/financeiro.sql</b> no SQL Editor e clique em verificar.</p>
      <Button size="sm" variant="outline" onClick={() => void inst.refetch()}>Verificar novamente</Button>
    </CardContent></Card>
  )
  if (inst.error || error) return <Card><CardContent className="p-6 flex gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" />{((inst.error || error) as Error).message}</CardContent></Card>

  const soma = (l: ContaOS[], k: 'valor' | 'recebido' | 'saldo') => l.reduce((a, c) => a + (c.isento && k === 'valor' ? 0 : c[k]), 0)

  const estornar = async (id: string) => {
    const motivo = window.prompt('Motivo do estorno deste recebimento:')
    if (!motivo?.trim()) return
    const { error: e } = await sbFin.from('financeiro_recebimentos').update({ estornado_em: new Date().toISOString(), estornado_por: user?.id, motivo_estorno: motivo.trim() }).eq('id', id)
    if (e) toast({ title: 'Erro ao estornar', description: e.message, variant: 'destructive' })
    else { toast({ title: 'Recebimento estornado' }); invalidar() }
  }

  const relContas = (l: ContaOS[]): Relatorio => ({
    colunas: ['OS', 'Execução', 'UF', 'Condomínio', 'Unidade', 'Morador', 'Tipo', 'Técnico', 'Valor', 'Recebido', 'Saldo', 'Situação'],
    linhas: l.map((c) => [c.protocolo, fd(c.dataExecucao), c.uf, c.condominio, c.unidade, c.morador, c.tipo, c.tecnico, fmtBRL(c.valor), fmtBRL(c.recebido), fmtBRL(c.saldo), SITUACAO_LABEL[c.situacao]]),
    rodape: [['Total', fmtBRL(soma(l, 'valor')), 'Recebido', fmtBRL(soma(l, 'recebido')), 'Pendente', fmtBRL(soma(l, 'saldo'))]],
  })

  // Resumos
  const ativos = recebs.filter((r) => !r.estornado_em)
  const agrupar = (chave: (r: typeof ativos[number]) => string) => {
    const m = new Map<string, { n: number; v: number }>()
    for (const r of ativos) { const k = chave(r) || '—'; const a = m.get(k) ?? { n: 0, v: 0 }; a.n++; a.v += Number(r.valor); m.set(k, a) }
    return [...m.entries()].sort((a, b) => b[1].v - a[1].v)
  }
  const porMes = agrupar((r) => r.data_pagamento.slice(0, 7).split('-').reverse().join('/')).sort((a, b) => b[0].split('/').reverse().join().localeCompare(a[0].split('/').reverse().join()))
  const porForma = agrupar((r) => r.forma_pagamento)
  const porUf = agrupar((r) => data?.contaMap.get(r.servico_id)?.uf ?? '')
  const porTec = agrupar((r) => data?.contaMap.get(r.servico_id)?.tecnico ?? '')
  const limite = Date.now() - Number(diasPend || 0) * 86400000
  const inadimplentes = (data?.contas ?? []).filter((c) => (c.situacao === 'pendente' || c.situacao === 'parcial') && c.saldo > 0 && (uf === 'todas' || c.uf === uf) && noPeriodo(c.dataExecucao) && c.dataExecucao && new Date(c.dataExecucao).getTime() < limite)

  const filtrosComuns = (
    <>
      <Select value={uf} onValueChange={setUf}><SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="todas">Todas UF</SelectItem>{ufs.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
      <span className="text-xs text-muted-foreground">Período:</span>
      <Input type="date" className="w-36 h-8" value={ini} onChange={(e) => setIni(e.target.value)} title="Data inicial" aria-label="Data inicial" />
      <span className="text-xs text-muted-foreground">até</span>
      <Input type="date" className="w-36 h-8" value={fim} onChange={(e) => setFim(e.target.value)} title="Data final" aria-label="Data final" />
      {periodos.map(([l, a, b]) => (
        <Button key={l} size="sm" variant={ini === a && fim === b ? 'secondary' : 'ghost'} className="h-8 px-2 text-xs" onClick={() => aplicarPeriodo(a, b)}>{l}</Button>
      ))}
      {periodoAtivo && <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => aplicarPeriodo(null, null)}>Limpar</Button>}
    </>
  )

  const TabelaGrupo = ({ titulo, linhas }: { titulo: string; linhas: [string, { n: number; v: number }][] }) => (
    <Card><CardContent className="p-3 space-y-2">
      <div className="flex justify-between items-center"><b className="text-sm">{titulo}</b>
        <Exportar titulo={`Recebimentos ${titulo}`} rel={() => ({ colunas: [titulo.replace('Por ', ''), 'Qtd', 'Valor'], linhas: linhas.map(([k, a]) => [k, a.n, fmtBRL(a.v)]) })} /></div>
      <Table><TableHeader><TableRow className="h-9"><TableHead>{titulo.replace('Por ', '')}</TableHead><TableHead>Qtd</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
        <TableBody className="text-xs">{linhas.map(([k, a]) => <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{a.n}</TableCell><TableCell className="text-right">{fmtBRL(a.v)}</TableCell></TableRow>)}</TableBody></Table>
    </CardContent></Card>
  )

  return (
    <>
      <Tabs value={aba} onValueChange={(v) => setParams({ aba: v })} className="space-y-3">
        <TabsList>
          <TabsTrigger value="receber">Contas a receber</TabsTrigger>
          <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
          <TabsTrigger value="resumo">Resumo e relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-3">
          <Totais itens={[['Valor dos serviços', fmtBRL(soma(contas, 'valor'))], ['Recebido', fmtBRL(soma(contas, 'recebido'))], ['Pendente', fmtBRL(soma(contas, 'saldo'))], ['OS em aberto', String(contas.filter((c) => c.saldo > 0).length)]]} />
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Buscar OS, condomínio, morador..." className="w-64 h-8" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <Select value={sit} onValueChange={setSit}><SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="abertas">Em aberto</SelectItem><SelectItem value="todas">Todas</SelectItem>
                {(Object.keys(SITUACAO_LABEL) as Situacao[]).map((s) => <SelectItem key={s} value={s}>{SITUACAO_LABEL[s]}</SelectItem>)}</SelectContent></Select>
            {filtrosComuns}
            <div className="ml-auto"><Exportar titulo="Contas a Receber" rel={() => relContas(contas)} /></div>
          </div>
          {periodoAtivo && <p className="text-xs text-muted-foreground">Período {fmtPeriodo(ini, fim)}: {contas.length} OS · {fmtBRL(soma(contas, 'valor'))} em valores · {fmtBRL(soma(contas, 'recebido'))} recebidos · {fmtBRL(soma(contas, 'saldo'))} em aberto.</p>}
          <Card><Table>
            <TableHeader><TableRow className="h-9"><TableHead>OS</TableHead><TableHead>Execução</TableHead><TableHead>Condomínio / Unidade</TableHead><TableHead>Morador</TableHead><TableHead>Tipo</TableHead><TableHead>Técnico</TableHead>
              <TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Recebido</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Situação</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody className="text-xs">
              {contas.slice(0, 500).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.protocolo}</TableCell><TableCell>{fd(c.dataExecucao)}</TableCell>
                  <TableCell>{c.uf} · {c.condominio} <span className="text-muted-foreground">{c.unidade}</span></TableCell>
                  <TableCell>{c.morador}</TableCell><TableCell>{c.tipo}</TableCell><TableCell>{c.tecnico}</TableCell>
                  <TableCell className="text-right">{fmtBRL(c.valor)}</TableCell><TableCell className="text-right">{fmtBRL(c.recebido)}</TableCell><TableCell className="text-right font-medium">{fmtBRL(c.saldo)}</TableCell>
                  <TableCell><Badge variant={variante[c.situacao]}>{SITUACAO_LABEL[c.situacao]}</Badge>
                    {c.formaInformada && c.situacao === 'pendente' && <div className="text-[10px] text-muted-foreground mt-0.5">Técnico informou: {c.formaInformada} — aguardando conferência</div>}</TableCell>
                  <TableCell><Button size="sm" variant="outline" className="h-7" onClick={() => setSel(c)}>Registrar</Button></TableCell>
                </TableRow>
              ))}
              {!contas.length && <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-6">Nenhuma OS encontrada.</TableCell></TableRow>}
            </TableBody>
          </Table></Card>
          {contas.length > 500 && <p className="text-xs text-muted-foreground">Mostrando 500 de {contas.length}. Use os filtros ou exporte para ver todas.</p>}
        </TabsContent>

        <TabsContent value="recebimentos" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={formaF} onValueChange={setFormaF}><SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todas">Todas as formas</SelectItem>{FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
            {filtrosComuns}
            <span className="text-sm font-medium">Total: {fmtBRL(ativos.reduce((a, r) => a + Number(r.valor), 0))}</span>
            <div className="ml-auto"><Exportar titulo="Recebimentos por Período" rel={() => ({
              colunas: ['Data', 'OS', 'Condomínio', 'Morador', 'Forma', 'Valor', 'Observação', 'Situação'],
              linhas: recebs.map((r) => { const c = data?.contaMap.get(r.servico_id); return [fd(r.data_pagamento), c?.protocolo ?? '', c?.condominio ?? '', c?.morador ?? '', r.forma_pagamento, fmtBRL(Number(r.valor)), r.observacao ?? '', r.estornado_em ? `Estornado: ${r.motivo_estorno}` : 'Válido'] }),
              rodape: [['Total válido', fmtBRL(ativos.reduce((a, r) => a + Number(r.valor), 0))]],
            })} /></div>
          </div>
          {periodoAtivo && <p className="text-xs text-muted-foreground">Período {fmtPeriodo(ini, fim)}: {recebs.length} recebimentos · {fmtBRL(ativos.reduce((a, r) => a + Number(r.valor), 0))} válidos.</p>}
          <Card><Table>
            <TableHeader><TableRow className="h-9"><TableHead>Data</TableHead><TableHead>OS</TableHead><TableHead>Condomínio</TableHead><TableHead>Morador</TableHead><TableHead>Forma</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Observação</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody className="text-xs">
              {recebs.slice(0, 500).map((r) => { const c = data?.contaMap.get(r.servico_id); return (
                <TableRow key={r.id} className={r.estornado_em ? 'opacity-50' : ''}>
                  <TableCell>{fd(r.data_pagamento)}</TableCell><TableCell>{c?.protocolo}</TableCell><TableCell>{c?.condominio} {c?.unidade}</TableCell><TableCell>{c?.morador}</TableCell>
                  <TableCell>{r.forma_pagamento}</TableCell><TableCell className="text-right">{fmtBRL(Number(r.valor))}</TableCell>
                  <TableCell>{r.observacao}{r.estornado_em && <div className="text-destructive">Estornado: {r.motivo_estorno}</div>}</TableCell>
                  <TableCell>{!r.estornado_em && <Button size="sm" variant="ghost" className="h-7" onClick={() => void estornar(r.id)}>Estornar</Button>}</TableCell>
                </TableRow>) })}
              {!recebs.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Nenhum recebimento lançado.</TableCell></TableRow>}
            </TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="resumo" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">{filtrosComuns}</div>
          <div className="grid md:grid-cols-2 gap-3">
            <TabelaGrupo titulo="Por mês" linhas={porMes} />
            <TabelaGrupo titulo="Por forma de pagamento" linhas={porForma} />
            <TabelaGrupo titulo="Por UF" linhas={porUf} />
            <TabelaGrupo titulo="Por técnico" linhas={porTec} />
          </div>
          <Card><CardContent className="p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2"><b className="text-sm">Inadimplência — OS pendentes há mais de</b>
              <Input className="w-16 h-8" value={diasPend} onChange={(e) => setDiasPend(e.target.value.replace(/\D/g, ''))} /><span className="text-sm">dias</span>
              <span className="text-sm font-medium ml-2">{inadimplentes.length} OS · {fmtBRL(soma(inadimplentes, 'saldo'))}</span>
              <div className="ml-auto"><Exportar titulo="Inadimplência" rel={() => relContas(inadimplentes)} /></div></div>
            <Table><TableHeader><TableRow className="h-9"><TableHead>OS</TableHead><TableHead>Execução</TableHead><TableHead>Condomínio</TableHead><TableHead>Morador</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody className="text-xs">{inadimplentes.slice(0, 200).map((c) => (
                <TableRow key={c.id}><TableCell>{c.protocolo}</TableCell><TableCell>{fd(c.dataExecucao)}</TableCell><TableCell>{c.condominio} {c.unidade}</TableCell><TableCell>{c.morador}</TableCell>
                  <TableCell className="text-right">{fmtBRL(c.saldo)}</TableCell><TableCell><Button size="sm" variant="outline" className="h-7" onClick={() => setSel(c)}>Registrar</Button></TableCell></TableRow>))}</TableBody></Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      <RegistrarRecebimentoDialog conta={sel} onClose={() => setSel(null)} />
    </>
  )
}

export default function Financeiro() {
  return (
    <Layout title="Financeiro">
      <ErrorBoundary area="o Financeiro"><Conteudo /></ErrorBoundary>
    </Layout>
  )
}
