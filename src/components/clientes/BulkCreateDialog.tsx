import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, removeMask } from '@/lib/formatters'

interface Empreendimento {
  id: string
  nome: string
}

interface BulkCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empreendimentos: Empreendimento[]
  onSuccess: () => void
}

interface BulkClienteData {
  identificacao_unidade: string
  nome?: string
  cpf?: string
  status: string
  leitura_inicial?: number
}

export default function BulkCreateDialog({ open, onOpenChange, empreendimentos, onSuccess }: BulkCreateDialogProps) {
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState('')
  const [bulkData, setBulkData] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setBulkData(text)
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      })
    }
  }

  const parseBulkData = (data: string): BulkClienteData[] => {
    const lines = data.trim().split('\n').filter(line => line.trim())
    const clients: BulkClienteData[] = []

    // Se for CSV com cabeçalho
    if (data.includes(',')) {
      const [header, ...rows] = lines
      const headers = header.split(',').map(h => h.trim().toLowerCase())
      
      rows.forEach(row => {
        const values = row.split(',').map(v => v.trim())
        const client: BulkClienteData = {
          identificacao_unidade: '',
          status: 'ativo'
        }

        headers.forEach((header, index) => {
          const value = values[index] || ''
          switch (header) {
            case 'unidade':
            case 'identificacao_unidade':
            case 'identificação':
              client.identificacao_unidade = value
              break
            case 'nome':
            case 'cliente':
              client.nome = value
              break
            case 'cpf':
              client.cpf = value
              break
            case 'status':
              client.status = value || 'ativo'
              break
            case 'leitura_inicial':
            case 'leitura inicial':
              client.leitura_inicial = parseFloat(value) || 0
              break
          }
        })

        if (client.identificacao_unidade) {
          clients.push(client)
        }
      })
    } else {
      // Lista simples de unidades
      lines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed) {
          clients.push({
            identificacao_unidade: trimmed,
            status: 'ativo'
          })
        }
      })
    }

    return clients
  }

  const handleSubmit = async () => {
    if (!selectedEmpreendimento || !bulkData.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um empreendimento e insira os dados das unidades.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const clientsData = parseBulkData(bulkData)
      
      if (clientsData.length === 0) {
        throw new Error("Nenhuma unidade válida encontrada nos dados fornecidos")
      }

      const clientsToInsert = clientsData.map(client => ({
        ...client,
        cpf: client.cpf ? removeMask(client.cpf) : null,
        empreendimento_id: selectedEmpreendimento,
        leitura_inicial: client.leitura_inicial || 0
      }))

      const { data: newClientes, error } = await supabase
        .from('clientes')
        .insert(clientsToInsert)
        .select('id, leitura_inicial')

      if (error) throw error

      // Criar leituras iniciais automaticamente
      const { data: { user } } = await supabase.auth.getUser()

      if (user && newClientes && newClientes.length > 0) {
        const { data: operador } = await supabase
          .from('operadores')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (operador) {
          const competenciaAtual = new Date().toISOString().slice(0, 7).replace('-', '/')
          
          const leiturasIniciais = newClientes.map(cliente => ({
            cliente_id: cliente.id,
            operador_id: operador.id,
            leitura_atual: cliente.leitura_inicial || 0,
            competencia: competenciaAtual,
            tipo_leitura: 'inicial_titularidade',
            data_leitura: new Date().toISOString(),
            observacao: 'Leitura inicial cadastrada automaticamente no sistema'
          }))

          await supabase.from('leituras').insert(leiturasIniciais)
        }
      }

      toast({
        title: "Unidades criadas com sucesso!",
        description: `${newClientes.length} unidade(s) e suas leituras iniciais foram adicionadas.`,
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Erro ao criar unidades",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedEmpreendimento('')
    setBulkData('')
    setCsvFile(null)
  }

  const exampleCsv = `unidade,nome,cpf,status,leitura_inicial
Apto 101,João Silva,123.456.789-00,ativo,1000.5
Apto 102,Maria Santos,987.654.321-00,ativo,850.0
Apto 103,,111.222.333-44,inativo,0`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastro em Massa de Unidades</DialogTitle>
          <DialogDescription>
            Adicione múltiplas unidades de uma vez usando CSV ou lista simples
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="empreendimento">Empreendimento *</Label>
            <Select
              value={selectedEmpreendimento}
              onValueChange={setSelectedEmpreendimento}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o empreendimento" />
              </SelectTrigger>
              <SelectContent>
                {empreendimentos.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="csv-upload">Upload de arquivo CSV (opcional)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="flex-1"
              />
              {csvFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCsvFile(null)
                    setBulkData('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="bulk-data">
              Dados das Unidades *
              <span className="text-sm text-muted-foreground ml-2">
                (CSV ou lista simples de unidades)
              </span>
            </Label>
            <Textarea
              id="bulk-data"
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder="Cole aqui os dados das unidades..."
              className="min-h-32"
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Exemplo de formato CSV:</span>
            </div>
            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
              {exampleCsv}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              Ou simplesmente liste as unidades, uma por linha: "Apto 101", "Apto 102", etc.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Unidades'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}