import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Camera, X, Plus, Loader2 } from 'lucide-react'
import { compressImage, isValidImageFile } from '@/lib/imageCompression'

interface ServicoExecucaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicoId: string
  tipoServico: string
  onSuccess: () => void
}

interface ImageUpload {
  file: File
  preview: string
  uploading: boolean
  url?: string
}

export default function ServicoExecucaoDialog({
  open,
  onOpenChange,
  servicoId,
  tipoServico,
  onSuccess
}: ServicoExecucaoDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImageUpload[]>([])
  const [formData, setFormData] = useState({
    descricaoRealizada: '',
    materiaisUtilizados: '',
    observacoes: '',
    horaInicio: new Date().toTimeString().slice(0, 5),
    horaFim: ''
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newImages: ImageUpload[] = []

    for (const file of Array.from(files)) {
      if (!isValidImageFile(file)) {
        toast({
          title: "Arquivo inválido",
          description: "Selecione apenas arquivos de imagem válidos",
          variant: "destructive"
        })
        continue
      }

      try {
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          maxSizeKB: 2048
        })

        const preview = URL.createObjectURL(compressedFile)
        newImages.push({
          file: compressedFile,
          preview,
          uploading: false
        })
      } catch (error) {
        console.error('Erro ao processar imagem:', error)
        const preview = URL.createObjectURL(file)
        newImages.push({
          file,
          preview,
          uploading: false
        })
      }
    }

    setImages(prev => [...prev, ...newImages])
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const uploadImage = async (imageUpload: ImageUpload): Promise<string | null> => {
    const fileName = `servico-${servicoId}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    try {
      const { data, error } = await supabase.storage
        .from('medidor-fotos')
        .upload(fileName, imageUpload.file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('medidor-fotos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.horaFim) {
      toast({
        title: "Campo obrigatório",
        description: "Informe a hora de fim do serviço",
        variant: "destructive"
      })
      return
    }

    if (!formData.descricaoRealizada.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva o serviço realizado",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Upload das imagens
      const uploadPromises = images.map(async (img, index) => {
        setImages(prev => prev.map((item, i) => 
          i === index ? { ...item, uploading: true } : item
        ))
        
        const url = await uploadImage(img)
        
        setImages(prev => prev.map((item, i) => 
          i === index ? { ...item, uploading: false, url } : item
        ))
        
        return url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const validUrls = uploadedUrls.filter(url => url !== null)

      // Atualizar o serviço com os dados da execução
      const { error } = await supabase
        .from('servicos')
        .update({
          status: 'concluido',
          data_execucao: new Date().toISOString(),
          hora_inicio: formData.horaInicio,
          hora_fim: formData.horaFim,
          descricao_servico_realizado: formData.descricaoRealizada,
          materiais_utilizados: formData.materiaisUtilizados || null,
          observacoes_execucao: formData.observacoes || null,
          fotos_servico: validUrls.length > 0 ? validUrls : null
        })
        .eq('id', servicoId)

      if (error) throw error

      toast({
        title: "Serviço concluído",
        description: "Dados do serviço registrados com sucesso"
      })

      resetForm()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao registrar execução:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a execução do serviço",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      descricaoRealizada: '',
      materiaisUtilizados: '',
      observacoes: '',
      horaInicio: new Date().toTimeString().slice(0, 5),
      horaFim: ''
    })
    
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Registrar Execução - {tipoServico}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="horaInicio">Hora de Início</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="horaFim">Hora de Fim</Label>
              <Input
                id="horaFim"
                type="time"
                value={formData.horaFim}
                onChange={(e) => setFormData(prev => ({ ...prev, horaFim: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Descrição do serviço realizado */}
          <div>
            <Label htmlFor="descricaoRealizada">Descrição do Serviço Realizado *</Label>
            <Textarea
              id="descricaoRealizada"
              placeholder="Descreva detalhadamente o que foi realizado..."
              value={formData.descricaoRealizada}
              onChange={(e) => setFormData(prev => ({ ...prev, descricaoRealizada: e.target.value }))}
              rows={4}
              required
            />
          </div>

          {/* Materiais utilizados */}
          <div>
            <Label htmlFor="materiaisUtilizados">Materiais Utilizados</Label>
            <Textarea
              id="materiaisUtilizados"
              placeholder="Liste os materiais utilizados no serviço..."
              value={formData.materiaisUtilizados}
              onChange={(e) => setFormData(prev => ({ ...prev, materiaisUtilizados: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre o serviço executado..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Upload de múltiplas fotos */}
          <div>
            <Label>Fotos do Serviço</Label>
            <div className="space-y-4">
              {/* Botão para adicionar fotos */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="photos"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photos')?.click()}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Fotos
                </Button>
                <span className="text-sm text-muted-foreground">
                  {images.length} foto(s) selecionada(s)
                </span>
              </div>

              {/* Preview das fotos */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image.preview}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        {image.url && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              Enviada
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Concluir Serviço'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}