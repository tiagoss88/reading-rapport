import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Copy } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ImportedRow {
  nome: string
  endereco: string
  uf: string
  quantidade_medidores: number
  rota: number
  isDuplicate?: boolean
  duplicateReason?: string
  duplicateMatch?: string // Nome do empreendimento que causou o match
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ImportarEmpreendimentosDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportedRow[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: existingEmpreendimentos } = useQuery({
    queryKey: ['empreendimentos-terceirizados-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('id, nome, endereco, uf')
      
      if (error) throw error
      return data
    }
  })

  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, ' ') // Normaliza espaços
  }

  const checkDuplicate = (nome: string, endereco: string, uf: string): { isDuplicate: boolean; reason?: string; matchName?: string } => {
    if (!existingEmpreendimentos) return { isDuplicate: false }
    
    const normalizedNome = normalizeString(nome)
    const normalizedEndereco = normalizeString(endereco)
    
    // Apenas marca como duplicado se NOME E ENDEREÇO E UF forem iguais
    const matchByNameAndAddress = existingEmpreendimentos.find(e => 
      normalizeString(e.nome) === normalizedNome && 
      normalizeString(e.endereco) === normalizedEndereco &&
      e.uf === uf
    )
    
    if (matchByNameAndAddress) {
      return { 
        isDuplicate: true, 
        reason: `Já existe no banco: "${matchByNameAndAddress.nome}"`,
        matchName: matchByNameAndAddress.nome
      }
    }
    
    return { isDuplicate: false }
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

        // Map headers to column indices
        const headers = jsonData[0].map(h => String(h || '').toUpperCase().trim())
        const getIndex = (names: string[]) => {
          for (const name of names) {
            const idx = headers.findIndex(h => h.includes(name))
            if (idx >= 0) return idx
          }
          return -1
        }

        const colMap = {
          nome: getIndex(['NOME', 'EMPREENDIMENTO', 'CONDOMÍNIO', 'CONDOMINIO']),
          endereco: getIndex(['ENDEREÇO', 'ENDERECO', 'LOGRADOURO']),
          uf: getIndex(['UF', 'ESTADO']),
          quantidade: getIndex(['QUANTIDADE', 'QTD', 'MEDIDORES', 'QTD MEDIDORES']),
          rota: getIndex(['ROTA', 'NÚMERO ROTA', 'NUMERO ROTA', 'N° ROTA'])
        }

        if (colMap.nome === -1 || colMap.endereco === -1) {
          toast({ 
            title: 'Colunas obrigatórias não encontradas', 
            description: 'A planilha precisa ter colunas NOME e ENDEREÇO',
            variant: 'destructive' 
          })
          return
        }

        const rows: ImportedRow[] = []
        const seenInFile = new Set<string>()
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          const nome = colMap.nome >= 0 ? String(row[colMap.nome] || '').trim() : ''
          const endereco = colMap.endereco >= 0 ? String(row[colMap.endereco] || '').trim() : ''
          let uf = colMap.uf >= 0 ? String(row[colMap.uf] || '').toUpperCase().trim() : 'BA'
          const quantidade = colMap.quantidade >= 0 ? parseInt(String(row[colMap.quantidade] || '0')) || 0 : 0
          const rota = colMap.rota >= 0 ? parseInt(String(row[colMap.rota] || '1')) || 1 : 1

          if (!nome || !endereco) continue
          if (uf !== 'BA' && uf !== 'CE') uf = 'BA' // Default

          // Verificar duplicata no arquivo (somente se nome E endereço E uf forem iguais)
          const fileKey = `${normalizeString(nome)}|${normalizeString(endereco)}|${uf}`
          if (seenInFile.has(fileKey)) {
            rows.push({
              nome,
              endereco,
              uf,
              quantidade_medidores: quantidade,
              rota,
              isDuplicate: true,
              duplicateReason: 'Duplicado na própria planilha (mesmo nome + endereço + UF)'
            })
            continue
          }
          seenInFile.add(fileKey)

          // Verificar duplicata no banco
          const { isDuplicate, reason, matchName } = checkDuplicate(nome, endereco, uf)
          
          rows.push({
            nome,
            endereco,
            uf,
            quantidade_medidores: quantidade,
            rota,
            isDuplicate,
            duplicateReason: reason,
            duplicateMatch: matchName
          })
        }

        setParsedData(rows)
        setStep('preview')
      } catch (error) {
        console.error('Error parsing file:', error)
        toast({ title: 'Erro ao processar planilha', variant: 'destructive' })
      }
    }
    reader.readAsBinaryString(file)
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const newRows = parsedData.filter(r => !r.isDuplicate)
      
      if (newRows.length === 0) {
        throw new Error('Nenhum registro novo para importar')
      }

      const toInsert = newRows.map(row => ({
        nome: row.nome,
        endereco: row.endereco,
        uf: row.uf,
        quantidade_medidores: row.quantidade_medidores,
        rota: row.rota
      }))

      const { error } = await supabase
        .from('empreendimentos_terceirizados')
        .insert(toInsert)
      
      if (error) throw error
      
      return newRows.length
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-terceirizados'] })
      setStep('success')
    },
    onError: (error: any) => {
      console.error('Import error:', error)
      toast({ title: error.message || 'Erro ao importar', variant: 'destructive' })
    }
  })

  const handleClose = () => {
    setFile(null)
    setParsedData([])
    setStep('upload')
    onOpenChange(false)
  }

  const newCount = parsedData.filter(r => !r.isDuplicate).length
  const duplicateCount = parsedData.filter(r => r.isDuplicate).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Empreendimentos
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
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

            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
              <p className="font-medium mb-2">Colunas esperadas:</p>
              <p><strong>Obrigatórias:</strong> NOME, ENDEREÇO</p>
              <p><strong>Opcionais:</strong> UF (BA/CE), QUANTIDADE MEDIDORES, ROTA</p>
              <p className="mt-2 text-xs">
                💡 Se a UF não for informada, será considerado BA por padrão.
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 dark:text-green-400">
                  {newCount} novo(s)
                </span>
              </div>
              {duplicateCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                  <Copy className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-800 dark:text-yellow-400">
                    {duplicateCount} duplicado(s)
                  </span>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-0 border rounded-md">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2 w-[120px]">Status</th>
                      <th className="text-left p-2 min-w-[250px]">Nome</th>
                      <th className="text-left p-2 min-w-[300px]">Endereço</th>
                      <th className="text-left p-2 w-[60px]">UF</th>
                      <th className="text-left p-2 w-[80px]">Rota</th>
                      <th className="text-left p-2 w-[100px]">Medidores</th>
                    </tr>
                  </thead>
                <tbody>
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className={`border-b ${row.isDuplicate ? 'bg-yellow-50/50 dark:bg-yellow-900/10 opacity-60' : ''}`}>
                      <td className="p-2">
                        {row.isDuplicate ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                              <Copy className="h-3 w-3 mr-1" />
                              Dup
                            </Badge>
                            {row.duplicateReason && (
                              <p className="text-xs text-yellow-600 max-w-[150px]" title={row.duplicateReason}>
                                {row.duplicateReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Novo
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 font-medium break-words">{row.nome}</td>
                      <td className="p-2 break-words">{row.endereco}</td>
                      <td className="p-2">{row.uf}</td>
                      <td className="p-2">{row.rota.toString().padStart(2, '0')}</td>
                      <td className="p-2">{row.quantidade_medidores}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </ScrollArea>

            {duplicateCount > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 dark:text-yellow-400 font-medium">
                    {duplicateCount} registro(s) duplicado(s) serão ignorados
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-500 text-xs">
                    Empreendimentos com mesmo nome e endereço já existentes não serão importados.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 flex-shrink-0 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={() => importMutation.mutate()} 
                disabled={importMutation.isPending || newCount === 0}
              >
                {importMutation.isPending ? 'Importando...' : `Importar ${newCount} empreendimento(s)`}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Importação Concluída!</h3>
            <p className="text-muted-foreground mb-4">
              {newCount} empreendimento(s) foram importados com sucesso.
            </p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
