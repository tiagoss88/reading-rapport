import { useState } from 'react'
import { Loader2, FileText, FileSpreadsheet, FileDown } from 'lucide-react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useEstoqueInstalacao, useArmazens, useMateriaisSaldo, useTiposServicoNomes } from '@/hooks/useEstoque'
import EstoqueNaoInstalado from '@/components/estoque/EstoqueNaoInstalado'
import {
  TipoRelEstoque, FiltrosEstoque, Relatorio, AgrupConsumo,
  gerarSaldo, gerarMovimentacoes, gerarConsumo,
} from '@/hooks/useRelatoriosEstoque'
import { exportarEstoquePDF, exportarEstoqueExcel, exportarEstoqueCSV } from '@/lib/exportEstoque'

const TITULOS: Record<TipoRelEstoque, string> = {
  saldo: 'Saldo Atual do Estoque',
  movimentacoes: 'Movimentações no Período',
  consumo: 'Consumo de Material por Serviço',
}
const TODOS = '__todos__'
const hoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
const inicioMes = () => hoje().slice(0, 8) + '01'
const br = (d: string) => d.split('-').reverse().join('/')

function Conteudo() {
  const { toast } = useToast()
  const { estado, recarregar } = useEstoqueInstalacao()
  const ok = estado === 'instalado'
  const { data: armazens = [] } = useArmazens(ok)
  const { data: materiais = [] } = useMateriaisSaldo(ok)
  const { data: tipos = [] } = useTiposServicoNomes(ok)
  const { data: tecnicos = [] } = useQuery({
    queryKey: ['rel-estoque', 'operadores'],
    enabled: ok,
    queryFn: async () => (await supabase.from('operadores').select('id, nome').order('nome')).data ?? [],
  })

  const [tipo, setTipo] = useState<TipoRelEstoque | null>(null)
  const [f, setF] = useState<FiltrosEstoque>({
    inicio: inicioMes(), fim: hoje(), armazemId: '', categoria: '', somenteAtivos: true,
    materialId: '', tipoMov: '', tipoServico: '', tecnicoId: '', agrupamento: 'tipo',
  })
  const [rel, setRel] = useState<Relatorio | null>(null)
  const [gerando, setGerando] = useState(false)
  const set = (p: Partial<FiltrosEstoque>) => setF((x) => ({ ...x, ...p }))
  const categorias = [...new Set(materiais.map((m) => m.categoria).filter(Boolean) as string[])].sort()

  if (estado === 'verificando') return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>
  if (estado === 'nao_instalado') return <EstoqueNaoInstalado onVerificar={() => void recarregar()} />
  if (estado === 'atualizacao_pendente') return <EstoqueNaoInstalado somenteArmazens onVerificar={() => void recarregar()} />
  if (estado === 'erro') return <p className="text-sm text-destructive">Não foi possível acessar o estoque.</p>

  const gerar = async () => {
    if (!tipo) return
    setGerando(true)
    try {
      const r = tipo === 'saldo' ? await gerarSaldo(f) : tipo === 'movimentacoes' ? await gerarMovimentacoes(f) : await gerarConsumo(f)
      setRel(r)
      if (!r.linhas.length) toast({ title: 'Nenhum dado encontrado para os filtros escolhidos.' })
    } catch (e) {
      toast({ title: 'Erro ao gerar relatório', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setGerando(false)
    }
  }

  const subtitulo = () => {
    const arm = f.armazemId ? armazens.find((a) => a.id === f.armazemId)?.nome : 'Todos os armazéns'
    return tipo === 'saldo' ? `${arm} — posição em ${br(hoje())}` : `${arm} — ${br(f.inicio)} a ${br(f.fim)}`
  }
  const sel = (v: string, on: (v: string) => void, opts: { v: string; l: string }[], ph: string) => (
    <Select value={v || TODOS} onValueChange={(x) => on(x === TODOS ? '' : x)}>
      <SelectTrigger className="h-9"><SelectValue placeholder={ph} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{ph}</SelectItem>
        {opts.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1 max-w-md">
            <Label>Tipo de Relatório</Label>
            <Select value={tipo ?? undefined} onValueChange={(v) => { setTipo(v as TipoRelEstoque); setRel(null) }}>
              <SelectTrigger><SelectValue placeholder="Selecione um relatório" /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TITULOS) as TipoRelEstoque[]).map((k) => <SelectItem key={k} value={k}>{TITULOS[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {tipo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {tipo !== 'saldo' && (
                <>
                  <div className="space-y-1"><Label>Data inicial</Label><Input type="date" className="h-9" value={f.inicio} onChange={(e) => set({ inicio: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Data final</Label><Input type="date" className="h-9" value={f.fim} onChange={(e) => set({ fim: e.target.value })} /></div>
                </>
              )}
              <div className="space-y-1"><Label>Armazém</Label>
                {sel(f.armazemId, (v) => set({ armazemId: v }), armazens.map((a) => ({ v: a.id, l: a.uf ? `${a.nome} (${a.uf})` : a.nome })), 'Todos os armazéns')}
              </div>
              {tipo === 'saldo' && (
                <>
                  <div className="space-y-1"><Label>Categoria</Label>
                    {sel(f.categoria, (v) => set({ categoria: v }), categorias.map((c) => ({ v: c, l: c })), 'Todas')}
                  </div>
                  <label className="flex items-center gap-2 text-sm h-9">
                    <Checkbox checked={f.somenteAtivos} onCheckedChange={(c) => set({ somenteAtivos: !!c })} /> Somente materiais ativos
                  </label>
                </>
              )}
              {tipo === 'movimentacoes' && (
                <>
                  <div className="space-y-1"><Label>Material</Label>
                    {sel(f.materialId, (v) => set({ materialId: v }), materiais.map((m) => ({ v: m.id, l: m.nome })), 'Todos')}
                  </div>
                  <div className="space-y-1"><Label>Tipo</Label>
                    {sel(f.tipoMov, (v) => set({ tipoMov: v }), [
                      { v: 'entrada', l: 'Entrada' }, { v: 'saida', l: 'Saída' }, { v: 'ajuste', l: 'Ajuste' }, { v: 'transferencia', l: 'Transferência' },
                    ], 'Todos')}
                  </div>
                </>
              )}
              {tipo === 'consumo' && (
                <>
                  <div className="space-y-1"><Label>Tipo de serviço</Label>
                    {sel(f.tipoServico, (v) => set({ tipoServico: v }), tipos.map((t) => ({ v: t, l: t })), 'Todos')}
                  </div>
                  <div className="space-y-1"><Label>Técnico</Label>
                    {sel(f.tecnicoId, (v) => set({ tecnicoId: v }), tecnicos.map((t) => ({ v: t.id, l: t.nome })), 'Todos')}
                  </div>
                  <div className="space-y-1"><Label>Agrupar por</Label>
                    <Select value={f.agrupamento} onValueChange={(v) => set({ agrupamento: v as AgrupConsumo })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tipo">Tipo de serviço</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="os">OS (protocolo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <Button onClick={() => void gerar()} disabled={gerando} className="h-9">
                {gerando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Gerar relatório
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {tipo && rel && rel.linhas.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base">{TITULOS[tipo]}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitulo()}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportarEstoquePDF(TITULOS[tipo], subtitulo(), rel)}><FileText className="h-4 w-4 mr-1" />PDF</Button>
              <Button size="sm" variant="outline" onClick={() => exportarEstoqueExcel(TITULOS[tipo], rel)}><FileSpreadsheet className="h-4 w-4 mr-1" />Excel</Button>
              <Button size="sm" variant="outline" onClick={() => exportarEstoqueCSV(TITULOS[tipo], rel)}><FileDown className="h-4 w-4 mr-1" />CSV</Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-auto max-h-[60vh] border rounded-md">
              <Table className="text-xs">
                <TableHeader><TableRow>{rel.colunas.map((c) => <TableHead key={c} className="h-9 whitespace-nowrap">{c}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {rel.linhas.map((l, i) => (
                    <TableRow key={i}>
                      {l.map((v, j) => (
                        <TableCell key={j} className={`py-1.5 ${v === 'Abaixo do mínimo' ? 'text-destructive font-medium' : ''}`}>{v}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rel.rodape?.map((r, i) => <p key={i} className="text-xs text-muted-foreground mt-2">{r.join('  ·  ')}</p>)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function RelatoriosEstoque() {
  return (
    <Layout title="Relatórios de Estoque">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios de Estoque</h1>
          <p className="text-muted-foreground text-sm">Saldo, movimentações e consumo de material por serviço</p>
        </div>
        <Conteudo />
      </div>
    </Layout>
  )
}
