import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, ClipboardPaste, Ban } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface ImportedRow {
  data_solicitacao: string | null
  uf: string
  condominio_nome_original: string
  bloco: string | null
  apartamento: string | null
  fonte: string | null
  morador_nome: string | null
  telefone: string | null
  email: string | null
  tipo_servico: string
  data_agendamento: string | null
  status_atendimento: string
  turno: string | null
  tecnico_nome: string | null
  observacao: string | null
  empreendimento_id?: string | null
  matched?: boolean
  isDuplicate?: boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Generate a normalized key for duplicate comparison
const makeDuplicateKey = (row: {
  data_solicitacao?: string | null
  uf?: string
  condominio_nome_original?: string
  bloco?: string | null
  apartamento?: string | null
  morador_nome?: string | null
}): string => {
  const norm = (v: string | null | undefined) => (v || '').toLowerCase().trim()
  return [
    norm(row.data_solicitacao),
    norm(row.uf),
    norm(row.condominio_nome_original),
    norm(row.bloco),
    norm(row.apartamento),
    norm(row.morador_nome),
  ].join('|')
}

export default function ImportarPlanilhaDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportedRow[]>([])
  const [step, setStep] = useState<'origem' | 'upload' | 'preview' | 'success'>('origem')
  const [pastedText, setPastedText] = useState('')
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file')
  const [origemSelecionada, setOrigemSelecionada] = useState<string>('NGD')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const origemFinal = origemSelecionada

  const { data: empreendimentos } = useQuery({
    queryKey: ['empreendimentos-terceirizados-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('id, nome, uf')
      if (error) throw error
      return data
    }
  })

  const { data: operadores } = useQuery({
    queryKey: ['operadores-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome')
      if (error) throw error
      return data
    }
  })

  // Fetch existing services for duplicate checking
  const { data: existingServices } = useQuery({
    queryKey: ['servicos-nacional-gas-duplicates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select('data_solicitacao, uf, condominio_nome_original, bloco, apartamento, morador_nome')
      if (error) throw error
      return data
    },
    enabled: open
  })

  const existingKeys = new Set(
    (existingServices || []).map(s => makeDuplicateKey(s))
  )

  const markDuplicates = (rows: ImportedRow[]): ImportedRow[] => {
    const seenKeys = new Set<string>()
    return rows.map(row => {
      const key = makeDuplicateKey(row)
      const isDuplicate = existingKeys.has(key) || seenKeys.has(key)
      seenKeys.add(key)
      return { ...row, isDuplicate }
    })
  }

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value)
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
      }
    }
    if (typeof value === 'string') {
      const parts = value.split('/')
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
    return null
  }

  const parseTurno = (value: string | null): string | null => {
    if (!value) return null
    const lower = value.toLowerCase().trim()
    if (lower.includes('manh') || lower === 'm') return 'manha'
    if (lower.includes('tard') || lower === 't') return 'tarde'
    return null
  }

  const parseStatus = (value: string | null): string => {
    if (!value) return 'pendente'
    const lower = value.toLowerCase().trim()
    if (lower.includes('execut') || lower.includes('realiz')) return 'executado'
    if (lower.includes('agend')) return 'agendado'
    if (lower.includes('cancel')) return 'cancelado'
    return 'pendente'
  }

  const findEmpreendimento = (nome: string, uf: string) => {
    if (!empreendimentos || !nome) return null
    const normalizedNome = nome.toLowerCase().trim()
    const match = empreendimentos.find(e =>
      e.uf === uf && e.nome.toLowerCase().trim().includes(normalizedNome)
    ) || empreendimentos.find(e =>
      e.uf === uf && normalizedNome.includes(e.nome.toLowerCase().trim())
    )
    return match?.id || null
  }

  const findTecnico = (nome: string | null) => {
    if (!operadores || !nome) return null
    const normalizedNome = nome.toLowerCase().trim()
    const match = operadores.find(o =>
      o.nome.toLowerCase().trim() === normalizedNome
    ) || operadores.find(o =>
      o.nome.toLowerCase().trim().includes(normalizedNome) ||
      normalizedNome.includes(o.nome.toLowerCase().trim())
    )
    return match?.id || null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const parseFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (jsonData.length < 2) {
          toast({ title: 'Planilha vazia ou sem dados', variant: 'destructive' })
          return
        }

        const headers = jsonData[0].map(h => String(h || '').toUpperCase().trim())
        const getIndex = (names: string[]) => {
          for (const name of names) {
            const idx = headers.findIndex(h => h.includes(name))
            if (idx >= 0) return idx
          }
          return -1
        }

        const colMap = {
          solicitacao: getIndex(['SOLICITAÇÃO', 'SOLICITACAO', 'DATA']),
          uf: getIndex(['UF', 'ESTADO']),
          condominio: getIndex(['CONDOMÍNIO', 'CONDOMINIO', 'EMPREENDIMENTO']),
          bloco: getIndex(['BLOCO', 'TORRE']),
          apto: getIndex(['APTO', 'APARTAMENTO', 'UNIDADE']),
          fonte: getIndex(['FONTE', 'ORIGEM']),
          morador: getIndex(['MORADOR', 'NOME', 'CLIENTE']),
          telefone: getIndex(['TELEFONE', 'TEL', 'CELULAR']),
          email: getIndex(['E-MAIL', 'EMAIL']),
          tipo: getIndex(['TIPO', 'SERVIÇO', 'SERVICO']),
          agend: getIndex(['AGEND', 'AGENDAMENTO']),
          atend: getIndex(['ATEND', 'ATENDIMENTO', 'STATUS']),
          turno: getIndex(['TURNO']),
          tecnico: getIndex(['TÉCNICO', 'TECNICO', 'RESPONSAVEL', 'RESPONSÁVEL']),
          obs: getIndex(['OBSERVAÇÃO', 'OBSERVACAO', 'OBS'])
        }

        const rows: ImportedRow[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          const uf = colMap.uf >= 0 ? String(row[colMap.uf] || '').toUpperCase().trim() : ''
          const condominio = colMap.condominio >= 0 ? String(row[colMap.condominio] || '').trim() : ''
          const tipo = colMap.tipo >= 0 ? String(row[colMap.tipo] || '').trim() : ''

          if (!condominio || !tipo) continue
          if (uf !== 'BA' && uf !== 'CE') continue

          const empreendimentoId = findEmpreendimento(condominio, uf)
          const tecnicoNome = colMap.tecnico >= 0 ? String(row[colMap.tecnico] || '').trim() : null

          rows.push({
            data_solicitacao: colMap.solicitacao >= 0 ? parseExcelDate(row[colMap.solicitacao]) : null,
            uf,
            condominio_nome_original: condominio,
            bloco: colMap.bloco >= 0 ? String(row[colMap.bloco] || '').trim() || null : null,
            apartamento: colMap.apto >= 0 ? String(row[colMap.apto] || '').trim() || null : null,
            fonte: origemFinal,
            morador_nome: colMap.morador >= 0 ? String(row[colMap.morador] || '').trim() || null : null,
            telefone: colMap.telefone >= 0 ? String(row[colMap.telefone] || '').trim() || null : null,
            email: colMap.email >= 0 ? String(row[colMap.email] || '').trim() || null : null,
            tipo_servico: tipo,
            data_agendamento: colMap.agend >= 0 ? parseExcelDate(row[colMap.agend]) : null,
            status_atendimento: colMap.atend >= 0 ? parseStatus(String(row[colMap.atend] || '')) : 'pendente',
            turno: colMap.turno >= 0 ? parseTurno(String(row[colMap.turno] || '')) : null,
            tecnico_nome: tecnicoNome,
            observacao: colMap.obs >= 0 ? String(row[colMap.obs] || '').trim() || null : null,
            empreendimento_id: empreendimentoId,
            matched: !!empreendimentoId
          })
        }

        setParsedData(markDuplicates(rows))
        setStep('preview')
      } catch (error) {
        console.error('Error parsing file:', error)
        toast({ title: 'Erro ao processar planilha', variant: 'destructive' })
      }
    }
    reader.readAsBinaryString(file)
  }

  const newRows = parsedData.filter(r => !r.isDuplicate)

  const importMutation = useMutation({
    mutationFn: async () => {
      const servicesToInsert = newRows.map(row => ({
        data_solicitacao: row.data_solicitacao,
        uf: row.uf,
        empreendimento_id: row.empreendimento_id,
        condominio_nome_original: row.condominio_nome_original,
        bloco: row.bloco,
        apartamento: row.apartamento,
        fonte: row.fonte,
        morador_nome: row.morador_nome,
        telefone: row.telefone,
        email: row.email,
        tipo_servico: row.tipo_servico,
        data_agendamento: row.data_agendamento,
        status_atendimento: row.status_atendimento,
        turno: row.turno,
        tecnico_id: findTecnico(row.tecnico_nome),
        observacao: row.observacao
      }))

      if (servicesToInsert.length === 0) {
        throw new Error('Nenhum serviço novo para importar')
      }

      const { error } = await supabase
        .from('servicos_nacional_gas')
        .insert(servicesToInsert)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-nacional-gas'] })
      queryClient.invalidateQueries({ queryKey: ['servicos-nacional-gas-duplicates'] })
      setStep('success')
    },
    onError: (error) => {
      console.error('Import error:', error)
      toast({ title: 'Erro ao importar serviços', variant: 'destructive' })
    }
  })

  const handleClose = () => {
    setFile(null)
    setParsedData([])
    setStep('origem')
    setPastedText('')
    setImportMethod('file')
    setOrigemSelecionada('NGD')
    setOrigemCustomizada('')
    onOpenChange(false)
  }

  const parseTextData = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      toast({ title: 'Dados insuficientes. Cole pelo menos cabeçalho + 1 linha de dados.', variant: 'destructive' })
      return
    }

    const headers = lines[0].split('\t').map(h => h.toUpperCase().trim())

    const getIndex = (names: string[]) => {
      for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name))
        if (idx >= 0) return idx
      }
      return -1
    }

    const colMap = {
      solicitacao: getIndex(['SOLICITAÇÃO', 'SOLICITACAO', 'DATA']),
      uf: getIndex(['UF', 'ESTADO']),
      condominio: getIndex(['CONDOMÍNIO', 'CONDOMINIO', 'EMPREENDIMENTO']),
      bloco: getIndex(['BLOCO', 'TORRE']),
      apto: getIndex(['APTO', 'APARTAMENTO', 'UNIDADE']),
      fonte: getIndex(['FONTE', 'ORIGEM']),
      morador: getIndex(['MORADOR', 'NOME', 'CLIENTE']),
      telefone: getIndex(['TELEFONE', 'TEL', 'CELULAR']),
      email: getIndex(['E-MAIL', 'EMAIL']),
      tipo: getIndex(['TIPO', 'SERVIÇO', 'SERVICO']),
      agend: getIndex(['AGEND', 'AGENDAMENTO']),
      atend: getIndex(['ATEND', 'ATENDIMENTO', 'STATUS']),
      turno: getIndex(['TURNO']),
      tecnico: getIndex(['TÉCNICO', 'TECNICO', 'RESPONSAVEL', 'RESPONSÁVEL']),
      obs: getIndex(['OBSERVAÇÃO', 'OBSERVACAO', 'OBS'])
    }

    const rows: ImportedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      if (!values || values.length === 0) continue

      const uf = colMap.uf >= 0 ? String(values[colMap.uf] || '').toUpperCase().trim() : ''
      const condominio = colMap.condominio >= 0 ? String(values[colMap.condominio] || '').trim() : ''
      const tipo = colMap.tipo >= 0 ? String(values[colMap.tipo] || '').trim() : ''

      if (!condominio || !tipo) continue
      if (uf !== 'BA' && uf !== 'CE') continue

      const empreendimentoId = findEmpreendimento(condominio, uf)
      const tecnicoNome = colMap.tecnico >= 0 ? String(values[colMap.tecnico] || '').trim() : null

      const parseDateText = (val: string | undefined): string | null => {
        if (!val) return null
        const trimmed = val.trim()
        const parts = trimmed.split('/')
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
        return null
      }

      rows.push({
        data_solicitacao: colMap.solicitacao >= 0 ? parseDateText(values[colMap.solicitacao]) : null,
        uf,
        condominio_nome_original: condominio,
        bloco: colMap.bloco >= 0 ? String(values[colMap.bloco] || '').trim() || null : null,
        apartamento: colMap.apto >= 0 ? String(values[colMap.apto] || '').trim() || null : null,
        fonte: origemFinal,
        morador_nome: colMap.morador >= 0 ? String(values[colMap.morador] || '').trim() || null : null,
        telefone: colMap.telefone >= 0 ? String(values[colMap.telefone] || '').trim() || null : null,
        email: colMap.email >= 0 ? String(values[colMap.email] || '').trim() || null : null,
        tipo_servico: tipo,
        data_agendamento: colMap.agend >= 0 ? parseDateText(values[colMap.agend]) : null,
        status_atendimento: colMap.atend >= 0 ? parseStatus(String(values[colMap.atend] || '')) : 'pendente',
        turno: colMap.turno >= 0 ? parseTurno(String(values[colMap.turno] || '')) : null,
        tecnico_nome: tecnicoNome || null,
        observacao: colMap.obs >= 0 ? String(values[colMap.obs] || '').trim() || null : null,
        empreendimento_id: empreendimentoId,
        matched: !!empreendimentoId
      })
    }

    if (rows.length === 0) {
      toast({ title: 'Nenhum serviço válido encontrado nos dados colados', variant: 'destructive' })
      return
    }

    setParsedData(markDuplicates(rows))
    setStep('preview')
  }

  const matchedCount = parsedData.filter(r => r.matched && !r.isDuplicate).length
  const unmatchedCount = parsedData.filter(r => !r.matched && !r.isDuplicate).length
  const duplicateCount = parsedData.filter(r => r.isDuplicate).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Planilha de Serviços
          </DialogTitle>
        </DialogHeader>

        {step === 'origem' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Origem dos serviços</Label>
              <p className="text-sm text-muted-foreground">
                Escolha a origem que será aplicada a <strong>todos</strong> os serviços desta importação.
                A coluna FONTE da planilha será ignorada.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem-select">Origem</Label>
              <Select value={origemSelecionada} onValueChange={setOrigemSelecionada}>
                <SelectTrigger id="origem-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGD">NGD — Nacional Gás Distribuidora</SelectItem>
                  <SelectItem value="Síndico">Síndico</SelectItem>
                  <SelectItem value="Administradora">Administradora</SelectItem>
                  <SelectItem value="Outro">Outro (especificar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {origemSelecionada === 'Outro' && (
              <div className="space-y-2">
                <Label htmlFor="origem-custom">Especifique a origem</Label>
                <Input
                  id="origem-custom"
                  placeholder="Digite a origem dos serviços"
                  value={origemCustomizada}
                  onChange={(e) => setOrigemCustomizada(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={() => setStep('upload')}
                disabled={origemSelecionada === 'Outro' && !origemCustomizada.trim()}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as 'file' | 'paste')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload de Arquivo
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex items-center gap-2">
                  <ClipboardPaste className="h-4 w-4" />
                  Colar da Planilha
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Clique para selecionar um arquivo</p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: .xlsx, .xls
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </TabsContent>

              <TabsContent value="paste" className="space-y-4">
                <Textarea
                  placeholder="Cole aqui os dados copiados diretamente da planilha Excel (Ctrl+V)..."
                  className="min-h-[200px] font-mono text-sm"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <Button
                  onClick={() => parseTextData(pastedText)}
                  disabled={!pastedText.trim()}
                  className="w-full"
                >
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Processar Dados Colados
                </Button>
              </TabsContent>
            </Tabs>

            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
              <p className="font-medium mb-2">Colunas esperadas:</p>
              <p>SOLICITAÇÃO, UF, CONDOMÍNIO, BLOCO, APTO, FONTE, MORADOR, TELEFONE, E-MAIL, TIPO DE SERVIÇO, AGEND, ATEND, TURNO, TÉCNICO, OBSERVAÇÃO</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex gap-4 shrink-0 flex-wrap items-center">
              <Badge variant="secondary" className="text-sm">
                Origem: {origemFinal}
              </Badge>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 dark:text-green-400">
                  {matchedCount} vinculados
                </span>
              </div>
              {unmatchedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-800 dark:text-yellow-400">
                    {unmatchedCount} não vinculados
                  </span>
                </div>
              )}
              {duplicateCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-md">
                  <Ban className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">
                    {duplicateCount} duplicado(s)
                  </span>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-[200px] max-h-[50vh] border rounded-md">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Condomínio</th>
                    <th className="text-left p-2">Bloco/Apto</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">UF</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${
                        row.isDuplicate
                          ? 'bg-destructive/5 line-through opacity-60'
                          : !row.matched
                          ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                          : ''
                      }`}
                    >
                      <td className="p-2">
                        {row.isDuplicate ? (
                          <span className="flex items-center gap-1 text-destructive text-xs font-medium">
                            <Ban className="h-4 w-4" />
                            Duplicado
                          </span>
                        ) : row.matched ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </td>
                      <td className="p-2">{row.condominio_nome_original}</td>
                      <td className="p-2">
                        {row.bloco && `Bl ${row.bloco}`}
                        {row.bloco && row.apartamento && ' - '}
                        {row.apartamento && `Ap ${row.apartamento}`}
                      </td>
                      <td className="p-2">{row.tipo_servico}</td>
                      <td className="p-2">{row.uf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="flex justify-end gap-2 shrink-0 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || newRows.length === 0}
              >
                {importMutation.isPending
                  ? 'Importando...'
                  : newRows.length === 0
                  ? 'Todos duplicados'
                  : `Importar ${newRows.length} serviço(s)`}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Importação Concluída!</h3>
            <p className="text-muted-foreground mb-4">
              {newRows.length} serviço(s) foram importados com sucesso.
              {duplicateCount > 0 && ` ${duplicateCount} duplicado(s) foram ignorados.`}
            </p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
