import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import * as XLSX from 'xlsx'
import { toast } from '@/hooks/use-toast'

interface ParsedRow {
  nome: string
  rota: number
}

export default function AdminGerarSQLRotas() {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [sql, setSql] = useState('')
  const [uf, setUf] = useState('BA')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)

      if (json.length === 0) {
        toast({ title: 'Planilha vazia', variant: 'destructive' })
        return
      }

      // Detect columns
      const headers = Object.keys(json[0])
      const nomeCol = headers.find(h => /nome|condom[ií]nio|empreendimento/i.test(h))
      const rotaCol = headers.find(h => /rota/i.test(h))

      if (!nomeCol || !rotaCol) {
        toast({
          title: 'Colunas não encontradas',
          description: `Headers: ${headers.join(', ')}. Esperado: coluna com "nome" e coluna com "rota".`,
          variant: 'destructive'
        })
        return
      }

      const parsed: ParsedRow[] = []
      for (const row of json) {
        const nome = String(row[nomeCol] || '').trim()
        const rota = Number(row[rotaCol])
        if (nome && !isNaN(rota) && rota > 0) {
          parsed.push({ nome, rota })
        }
      }

      setRows(parsed)
      toast({ title: `${parsed.length} linhas lidas do Excel` })
    }
    reader.readAsArrayBuffer(file)
  }

  const gerarSQL = () => {
    if (rows.length === 0) return

    const escapeSql = (s: string) => s.replace(/'/g, "''")

    const statements = rows.map(r =>
      `UPDATE empreendimentos_terceirizados SET rota = ${r.rota} WHERE UPPER(TRIM(nome)) = '${escapeSql(r.nome.trim().toUpperCase())}' AND uf = '${uf}';`
    )

    const fullSql = `-- Atualização de rotas para UF = ${uf}\n-- Total: ${rows.length} empreendimentos\n-- Gerado em: ${new Date().toLocaleString('pt-BR')}\n\nBEGIN;\n\n${statements.join('\n')}\n\nCOMMIT;\n`

    setSql(fullSql)
  }

  const copiar = () => {
    navigator.clipboard.writeText(sql)
    toast({ title: 'SQL copiado para a área de transferência!' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gerar SQL de Atualização de Rotas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Faça upload de um Excel com colunas "Nome" e "Rota". O sistema gera os comandos SQL para você executar no banco.
          </p>

          <div className="flex items-center gap-4">
            <div className="w-32">
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="max-w-xs"
            />
          </div>

          {rows.length > 0 && (
            <>
              <div className="text-sm font-medium">{rows.length} linhas lidas. Preview:</div>
              <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto font-mono text-xs">
                {rows.slice(0, 20).map((r, i) => (
                  <div key={i}>Rota {r.rota} → {r.nome}</div>
                ))}
                {rows.length > 20 && <div>... e mais {rows.length - 20} linhas</div>}
              </div>
              <Button onClick={gerarSQL}>Gerar SQL</Button>
            </>
          )}

          {sql && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SQL gerado:</span>
                <Button variant="outline" size="sm" onClick={copiar}>Copiar SQL</Button>
              </div>
              <textarea
                readOnly
                value={sql}
                className="w-full h-80 bg-muted rounded-md p-3 font-mono text-xs border"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
