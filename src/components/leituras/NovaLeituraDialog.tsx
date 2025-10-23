import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Upload, X, Camera } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { compressImage, isValidImageFile, getOptimalCompressionOptions } from '@/lib/imageCompression'
import { format } from 'date-fns'

interface Cliente {
  id: string
  identificacao_unidade: string
  nome?: string
  empreendimentos?: {
    nome: string
  }
}

interface Operador {
  id: string
  nome: string
}

interface NovaLeituraDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function NovaLeituraDialog({ open, onOpenChange, onSuccess }: NovaLeituraDialogProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    cliente_id: '',
    operador_id: '',
    leitura_atual: '',
    observacao: '',
    tipo_observacao: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    try {
      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select(`
          id,
          identificacao_unidade,
          nome,
          empreendimentos:empreendimento_id (nome)
        `)
        .eq('status', 'ativo')
        .order('identificacao_unidade')

      if (clientesError) throw clientesError
      setClientes(clientesData || [])

      // Buscar operadores
      const { data: operadoresData, error: operadoresError } = await supabase
        .from('operadores')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome')

      if (operadoresError) throw operadoresError
      setOperadores(operadoresData || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!isValidImageFile(file)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        })
        return
      }

      try {
        // Show loading state
        toast({
          title: "Processando imagem...",
          description: "Otimizando a foto para sincronização."
        })

        // Get optimal compression settings based on file size
        const fileSizeKB = file.size / 1024
        const compressionOptions = getOptimalCompressionOptions(fileSizeKB)
        
        // Compress the image
        const compressedFile = await compressImage(file, compressionOptions)
        
        setSelectedFile(compressedFile)
        const url = URL.createObjectURL(compressedFile)
        setPreviewUrl(url)

        toast({
          title: "Foto otimizada",
          description: `Tamanho reduzido de ${fileSizeKB.toFixed(0)}KB para ${(compressedFile.size / 1024).toFixed(0)}KB`
        })

      } catch (error) {
        console.error('Erro ao comprimir imagem:', error)
        toast({
          title: "Erro ao processar imagem",
          description: "Usando imagem original. Verifique o formato do arquivo.",
          variant: "destructive"
        })
        
        // Fallback to original file
        setSelectedFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `leituras/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('medidor-fotos')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Use public URL for permanent access
    const { data } = supabase.storage
      .from('medidor-fotos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cliente_id || !formData.operador_id || !formData.leitura_atual) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Calcular competência (YYYY-MM)
      const competencia = format(new Date(), 'yyyy-MM')

      // Validar se já existe leitura na competência
      const { data: leituraExistente, error: validacaoError } = await supabase
        .from('leituras')
        .select('id')
        .eq('cliente_id', formData.cliente_id)
        .eq('competencia', competencia)
        .eq('tipo_leitura', 'normal')
        .maybeSingle()

      if (validacaoError) throw validacaoError

      if (leituraExistente) {
        toast({
          title: "Leitura já registrada",
          description: `Já existe uma leitura para este cliente na competência ${competencia}`,
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      let foto_url = null
      
      // Upload da imagem se fornecida
      if (selectedFile) {
        foto_url = await uploadImage(selectedFile)
      }

      // Inserir leitura
      const { error } = await supabase
        .from('leituras')
        .insert([{
          cliente_id: formData.cliente_id,
          operador_id: formData.operador_id,
          leitura_atual: parseFloat(formData.leitura_atual),
          observacao: formData.observacao || null,
          tipo_observacao: formData.tipo_observacao || null,
          foto_url,
          data_leitura: new Date().toISOString(),
          competencia,
          tipo_leitura: 'normal',
          status_sincronizacao: 'sincronizado'
        }])

      if (error) throw error

      toast({
        title: "Leitura registrada!",
        description: "A nova leitura foi adicionada com sucesso.",
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Erro ao registrar leitura",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      operador_id: '',
      leitura_atual: '',
      observacao: '',
      tipo_observacao: ''
    })
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const removeImage = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Leitura Manual</DialogTitle>
          <DialogDescription>
            Registre uma nova leitura no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Unidade/Cliente *</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.identificacao_unidade} - {cliente.empreendimentos?.nome}
                      {cliente.nome && ` (${cliente.nome})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="operador">Operador *</Label>
              <Select
                value={formData.operador_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, operador_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o operador" />
                </SelectTrigger>
                <SelectContent>
                  {operadores.map((operador) => (
                    <SelectItem key={operador.id} value={operador.id}>
                      {operador.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="leitura_atual">Leitura Atual (m³) *</Label>
            <Input
              id="leitura_atual"
              type="number"
              step="0.001"
              value={formData.leitura_atual}
              onChange={(e) => setFormData(prev => ({ ...prev, leitura_atual: e.target.value }))}
              placeholder="Ex: 1234.567"
              required
            />
          </div>

          <div>
            <Label htmlFor="tipo_observacao">Tipo de Observação</Label>
            <Select
              value={formData.tipo_observacao}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_observacao: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma observação</SelectItem>
                <SelectItem value="medidor_danificado">Medidor Danificado</SelectItem>
                <SelectItem value="local_inacessivel">Local Inacessível</SelectItem>
                <SelectItem value="cliente_ausente">Cliente Ausente</SelectItem>
                <SelectItem value="leitura_estimada">Leitura Estimada</SelectItem>
                <SelectItem value="irregularidade">Irregularidade</SelectItem>
                <SelectItem value="observacao">Observação Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacao">Observação Detalhada</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder="Digite observações adicionais (opcional)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="foto">Foto do Medidor</Label>
            <div className="space-y-3">
              {!selectedFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="foto" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:text-primary/80">
                      Clique para selecionar uma foto
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG até 10MB
                    </p>
                  </Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img
                          src={previewUrl!}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Leitura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}