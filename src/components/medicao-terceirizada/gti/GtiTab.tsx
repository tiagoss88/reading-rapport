import { useMemo, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Upload, Download, Loader2, Trash2, Pencil, FileSpreadsheet } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/contexts/PermissionsContext'
import { format } from 'date-fns'

type Row = {
  id: string
  uf: 'CE' | 'BA'
  condominio: string
  leitura_anterior: string | null
  prazo_inicial: string | null
  prazo_final: string | null
  mes_referencia: number
  ano_referencia: number
  importado_em: string
}

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// Parse dd/mm/yyyy or ISO or Excel serial → 'yyyy-MM-dd'
function parseDate(input: unknown): string | null {
  if (input == null || input === '') return null
  if (typeof input === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(input)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  const s = String(input).trim()
  if (!s) return null
  const br = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (br) {
    let [_, d, m, y] = br
    if (y.length === 2) y = '20' + y
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const parsed = new Date(s)
  if (!isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd')
  return null
}

function normHeader(h: string) {
  return String(h || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const HEADER_ALIASES: Record<string, string> = {
  uf: 'uf',
  condominio: 'condominio',
  'condomínio': 'condominio',
  cliente: 'condominio',
  'leitura anterior': 'leitura_anterior',
  'data leitura anterior': 'leitura_anterior',
  'data coleta anterior': 'leitura_anterior',
  'prazo inicial': 'prazo_inicial',
  'data inicial': 'prazo_inicial',
  'inicio': 'prazo_inicial',
  'início': 'prazo_inicial',
  'prazo final': 'prazo_final',
  'data final': 'prazo_final',
  'fim': 'prazo_final',
}

const anoAtual = new Date().getFullYear()
const mesAtual = new Date().getMonth() + 1

export default function GtiTab() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { isAdmin, hasRole } = usePermissions()
  const podeEditar = isAdmin || hasRole('gestor_empreendimento')

  const [mes, setMes] = useState<number>(mesAtual)
  const [ano, setAno] = useState<number>(anoAtual)
  const [uf, setUf] = useState<'TODOS'|'CE'|'BA'>('TODOS')
  const [busca, setBusca] = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [delRow, setDelRow] = useState<Row | null>(null)

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['gti-leituras', ano, mes, uf],
    queryFn: async () => {
      let q = supabase.from('gti_leituras_mensais' as any)
        .select('*')
        .eq('ano_referencia', ano)
        .eq('mes_referencia', mes)
        .order('uf', { ascending: true })
        .order('condominio', { ascending: true })
      if (uf !== 'TODOS') q = q.eq('uf', uf)
      const { data, error } = await q
      if (error) throw error
      return (data as any as Row[]) || []
    },
  })

  const filtrados = useMemo(() => {
    if (!busca) return registros
    const b = busca.toLowerCase()
    return registros.filter(r => r.condominio.toLowerCase().includes(b))
  }, [registros, busca])

  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - 3 + i)

  const exportarCSV = () => {
    const rows = [
      ['UF','CONDOMINIO','LEITURA ANTERIOR','PRAZO INICIAL','PRAZO FINAL'],
      ...filtrados.map(r => [
        r.uf,
        r.condominio,
        r.leitura_anterior ? format(new Date(r.leitura_anterior + 'T00:00:00'), 'dd/MM/yyyy') : '',
        r.prazo_inicial ? format(new Date(r.prazo_inicial + 'T00:00:00'), 'dd/MM/yyyy') : '',
        r.prazo_final ? format(new Date(r.prazo_final + 'T00:00:00'), 'dd/MM/yyyy') : '',
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n')
    const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gti-${ano}-${String(mes).padStart(2,'0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const excluir = async () => {
    if (!delRow) return
    const { error } = await supabase.from('gti_leituras_mensais' as any).delete().eq('id', delRow.id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Registro excluído' })
      qc.invalidateQueries({ queryKey: ['gti-leituras'] })
    }
    setDelRow(null)
  }

  const salvarEdicao = async (r: Row) => {
    const { error } = await supabase.from('gti_leituras_mensais' as any).update({
      leitura_anterior: r.leitura_anterior,
      prazo_inicial: r.prazo_inicial,
      prazo_final: r.prazo_final,
    }).eq('id', r.id)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Atualizado com sucesso' })
      qc.invalidateQueries({ queryKey: ['gti-leituras'] })
      setEditRow(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Planilha GTI — Coletas CE/BA
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportarCSV} disabled={filtrados.length===0}>
              <Download className="h-4 w-4 mr-1" /> Exportar CSV
            </Button>
            {podeEditar && (
              <Button size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1" /> Importar planilha
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{MESES.map((m,i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={uf} onValueChange={v => setUf(v as any)}>
            <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos UF</SelectItem>
              <SelectItem value="CE">CE</SelectItem>
              <SelectItem value="BA">BA</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar condomínio..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="max-w-xs h-9"
          />
          <Badge variant="secondary" className="ml-auto self-center">{filtrados.length} registro(s)</Badge>
        </div>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="text-xs">UF</TableHead>
                <TableHead className="text-xs">Condomínio</TableHead>
                <TableHead className="text-xs">Leitura anterior</TableHead>
                <TableHead className="text-xs">Prazo inicial</TableHead>
                <TableHead className="text-xs">Prazo final</TableHead>
                <TableHead className="text-xs">Importado em</TableHead>
                {podeEditar && <TableHead className="text-xs w-[90px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                  Nenhum registro. {podeEditar && 'Clique em "Importar planilha" para começar.'}
                </TableCell></TableRow>
              ) : filtrados.map(r => (
                <TableRow key={r.id} className="text-xs">
                  <TableCell><Badge variant={r.uf==='CE'?'default':'secondary'}>{r.uf}</Badge></TableCell>
                  <TableCell className="font-medium">{r.condominio}</TableCell>
                  <TableCell>{r.leitura_anterior ? format(new Date(r.leitura_anterior+'T00:00:00'),'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{r.prazo_inicial ? format(new Date(r.prazo_inicial+'T00:00:00'),'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{r.prazo_final ? format(new Date(r.prazo_final+'T00:00:00'),'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{format(new Date(r.importado_em),'dd/MM/yyyy HH:mm')}</TableCell>
                  {podeEditar && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditRow(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDelRow(r)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} defaultMes={mes} defaultAno={ano} />

      {editRow && <EditDialog row={editRow} onClose={() => setEditRow(null)} onSave={salvarEdicao} />}

      <AlertDialog open={!!delRow} onOpenChange={o => !o && setDelRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              {delRow?.condominio} — {delRow?.uf} ({delRow && MESES[delRow.mes_referencia-1]}/{delRow?.ano_referencia})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ---------- Import Dialog ----------

type ParsedRow = {
  uf: string
  condominio: string
  leitura_anterior: string | null
  prazo_inicial: string | null
  prazo_final: string | null
  _rowIndex: number
  _error?: string
}

function ImportDialog({ open, onOpenChange, defaultMes, defaultAno }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultMes: number
  defaultAno: number
}) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mes, setMes] = useState(defaultMes)
  const [ano, setAno] = useState(defaultAno)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)

  const validos = rows.filter(r => !r._error)
  const invalidos = rows.filter(r => r._error)

  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - 3 + i)

  const reset = () => {
    setRows([])
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: null, raw: true })

    const parsed: ParsedRow[] = raw.map((r, idx) => {
      // Map headers via aliases
      const mapped: Record<string, any> = {}
      Object.keys(r).forEach(k => {
        const canon = HEADER_ALIASES[normHeader(k)]
        if (canon) mapped[canon] = r[k]
      })

      let condominio = String(mapped.condominio ?? '').trim()
      let ufv = String(mapped.uf ?? '').trim().toUpperCase()

      let error: string | undefined
      if (!condominio) error = 'Condomínio vazio'
      else if (ufv !== 'CE' && ufv !== 'BA') error = `UF inválida: "${ufv}"`

      // Regra do projeto: condomínios BA devem ter prefixo "BA "
      if (!error && ufv === 'BA' && !/^BA\s/i.test(condominio)) {
        condominio = 'BA ' + condominio
      }

      return {
        uf: ufv,
        condominio,
        leitura_anterior: parseDate(mapped.leitura_anterior),
        prazo_inicial: parseDate(mapped.prazo_inicial),
        prazo_final: parseDate(mapped.prazo_final),
        _rowIndex: idx + 2, // header row + 1-based
        _error: error,
      }
    })
    setRows(parsed)
  }

  const importar = async () => {
    if (validos.length === 0) {
      toast({ title: 'Nenhuma linha válida', variant: 'destructive' })
      return
    }
    setImporting(true)
    const { data: userRes } = await supabase.auth.getUser()
    const payload = validos.map(r => ({
      uf: r.uf,
      condominio: r.condominio,
      leitura_anterior: r.leitura_anterior,
      prazo_inicial: r.prazo_inicial,
      prazo_final: r.prazo_final,
      mes_referencia: mes,
      ano_referencia: ano,
      importado_por: userRes.user?.id,
      importado_em: new Date().toISOString(),
    }))
    const { error } = await supabase.from('gti_leituras_mensais' as any)
      .upsert(payload, { onConflict: 'uf,condominio,ano_referencia,mes_referencia' })

    setImporting(false)
    if (error) {
      toast({ title: 'Erro ao importar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Importação concluída', description: `${validos.length} linha(s) processada(s). ${invalidos.length} rejeitada(s).` })
      qc.invalidateQueries({ queryKey: ['gti-leituras'] })
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar planilha GTI</DialogTitle>
          <DialogDescription className="text-xs">
            Colunas esperadas: <b>UF, CONDOMINIO, LEITURA ANTERIOR, PRAZO INICIAL, PRAZO FINAL</b>. Datas em dd/mm/aaaa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-muted-foreground">Mês de referência</label>
              <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{MESES.map((m,i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ano</label>
              <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
                <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs text-muted-foreground">Arquivo (.xlsx ou .csv)</label>
              <Input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="h-9"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          </div>

          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2 text-xs">
                <Badge variant="default">{validos.length} válidas</Badge>
                {invalidos.length > 0 && <Badge variant="destructive">{invalidos.length} com erro</Badge>}
                <span className="text-muted-foreground self-center">{fileName}</span>
              </div>
              <div className="border rounded-md max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs">Linha</TableHead>
                      <TableHead className="text-xs">UF</TableHead>
                      <TableHead className="text-xs">Condomínio</TableHead>
                      <TableHead className="text-xs">Leit. ant.</TableHead>
                      <TableHead className="text-xs">Prazo ini.</TableHead>
                      <TableHead className="text-xs">Prazo fim</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 100).map((r, i) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell>{r._rowIndex}</TableCell>
                        <TableCell>{r.uf}</TableCell>
                        <TableCell>{r.condominio}</TableCell>
                        <TableCell>{r.leitura_anterior ?? '-'}</TableCell>
                        <TableCell>{r.prazo_inicial ?? '-'}</TableCell>
                        <TableCell>{r.prazo_final ?? '-'}</TableCell>
                        <TableCell>{r._error
                          ? <Badge variant="destructive" className="text-[10px]">{r._error}</Badge>
                          : <Badge variant="default" className="text-[10px]">OK</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 100 && <p className="text-xs text-muted-foreground">Mostrando 100 de {rows.length} linhas.</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>Cancelar</Button>
          <Button onClick={importar} disabled={importing || validos.length === 0}>
            {importing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Importar {validos.length > 0 && `(${validos.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Edit Dialog ----------

function EditDialog({ row, onClose, onSave }: {
  row: Row
  onClose: () => void
  onSave: (r: Row) => void
}) {
  const [r, setR] = useState<Row>(row)
  return (
    <Dialog open={true} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
          <DialogDescription className="text-xs">{row.uf} — {row.condominio}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Leitura anterior</label>
            <Input type="date" value={r.leitura_anterior ?? ''} onChange={e => setR({...r, leitura_anterior: e.target.value || null})} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Prazo inicial</label>
            <Input type="date" value={r.prazo_inicial ?? ''} onChange={e => setR({...r, prazo_inicial: e.target.value || null})} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Prazo final</label>
            <Input type="date" value={r.prazo_final ?? ''} onChange={e => setR({...r, prazo_final: e.target.value || null})} className="h-9" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(r)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
