import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Building2, Gauge, Camera, CheckCircle, Navigation, MapPin, ImagePlus, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { compressImage, isValidImageFile, getOptimalCompressionOptions } from '@/lib/imageCompression'
import { format } from 'date-fns'

interface FotoItem {
  file: File
  preview: string
}

export default function ColetorEmpreendimentoDetalhe() {
  const { empreendimentoId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [fotos, setFotos] = useState<FotoItem[]>([])
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: empreendimento, isLoading } = useQuery({
    queryKey: ['empreendimento-detalhe', empreendimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .eq('id', empreendimentoId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!empreendimentoId,
  })

  const handleFotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    // Reset input so same files can be re-selected
    event.target.value = ''

    const validFiles = filesArray.filter(f => isValidImageFile(f))
    if (validFiles.length === 0) {
      toast({ title: "Arquivo inválido", description: "Selecione apenas arquivos de imagem.", variant: "destructive" })
      return
    }

    if (validFiles.length > 1) {
      toast({ title: `Processando ${validFiles.length} imagens...`, description: "Otimizando as fotos." })
    } else {
      toast({ title: "Processando imagem...", description: "Otimizando a foto." })
    }

    let adicionadas = 0
    for (const file of validFiles) {
      try {
        const fileSizeKB = file.size / 1024
        const compressionOptions = getOptimalCompressionOptions(fileSizeKB)
        const compressedFile = await compressImage(file, compressionOptions)

        await new Promise<void>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            setFotos(prev => [...prev, { file: compressedFile, preview: reader.result as string }])
            resolve()
          }
          reader.readAsDataURL(compressedFile)
        })
        adicionadas++
      } catch {
        await new Promise<void>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            setFotos(prev => [...prev, { file, preview: reader.result as string }])
            resolve()
          }
          reader.readAsDataURL(file)
        })
        adicionadas++
      }
    }

    toast({
      title: adicionadas > 1 ? `${adicionadas} fotos adicionadas` : "Foto adicionada",
      description: adicionadas > 1 ? "Imagens otimizadas com sucesso." : "Imagem otimizada com sucesso.",
    })
  }

  const removerFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
  }

  const confirmarColeta = async () => {
    if (fotos.length === 0) {
      toast({ title: "Foto obrigatória", description: "Tire pelo menos uma foto do comprovante de sincronização antes de confirmar.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: operador } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!operador) throw new Error('Operador não encontrado')

      // Upload all photos in parallel
      const uploadPromises = fotos.map(async (foto) => {
        const fileExt = foto.file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `coletas/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('medidor-fotos')
          .upload(filePath, foto.file)
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('medidor-fotos')
          .getPublicUrl(filePath)

        return urlData.publicUrl
      })

      const urls = await Promise.all(uploadPromises)

      const dataHojeLocal = format(new Date(), 'yyyy-MM-dd')

      // Build observacao field
      let obsText = `Fotos comprovante: ${urls.join(', ')}`
      if (observacao.trim()) {
        obsText += ` | Obs: ${observacao.trim()}`
      }

      // Registrar coleta
      const { error } = await supabase
        .from('servicos_nacional_gas')
        .insert({
          empreendimento_id: empreendimentoId!,
          condominio_nome_original: empreendimento!.nome,
          tipo_servico: 'leitura',
          status_atendimento: 'executado',
          uf: empreendimento!.uf,
          tecnico_id: operador.id,
          observacao: obsText,
          data_agendamento: dataHojeLocal,
        })
      if (error) throw error

      // Best effort: update rotas_leitura
      const { data: rotasAtualizadas, error: rotaUpdateError } = await supabase
        .from('rotas_leitura')
        .update({ status: 'concluido' })
        .eq('empreendimento_id', empreendimentoId!)
        .eq('data', dataHojeLocal)
        .neq('status', 'concluido')
        .select('id')

      if (rotaUpdateError) {
        console.warn('Aviso ao atualizar rota_leitura no coletor:', rotaUpdateError.message)
      } else if (!rotasAtualizadas?.length) {
        console.warn('Nenhuma rota_leitura atualizada no coletor.', { empreendimentoId, dataHojeLocal })
      }

      toast({ title: "Coleta confirmada!", description: "Registro salvo com sucesso." })
      navigate(-1)
    } catch (error: any) {
      console.error('Erro ao confirmar coleta:', error)
      toast({ title: "Erro", description: error.message || "Falha ao confirmar coleta", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const enderecoEncoded = empreendimento ? encodeURIComponent(empreendimento.endereco) : ''

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!empreendimento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Empreendimento não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{empreendimento.nome}</h1>
            <p className="text-xs text-muted-foreground">Detalhes do empreendimento</p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gauge className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{empreendimento.quantidade_medidores}</p>
                <p className="text-sm text-muted-foreground">medidores no condomínio</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start space-x-2 mb-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{empreendimento.endereco}</p>
              </div>
              <div className="flex gap-2">
                <a href={`https://waze.com/ul?q=${enderecoEncoded}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Navigation className="w-3 h-3 mr-1" />
                    Waze
                  </Button>
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    Google Maps
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observação */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-2">Observação (opcional)</p>
            <Textarea
              placeholder="Registre aqui eventuais acontecimentos durante a coleta..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Fotos Comprovante */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              Fotos do comprovante de sincronização
              {fotos.length > 0 && <span className="text-muted-foreground ml-1">({fotos.length})</span>}
            </p>

            {/* Grid de previews */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {fotos.map((foto, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={foto.preview}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 rounded-lg border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removerFoto(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botões sempre visíveis */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className={`${fotos.length === 0 ? 'h-32' : 'h-10'} border-dashed border-2 flex flex-col items-center justify-center gap-1 text-muted-foreground`}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className={fotos.length === 0 ? 'w-8 h-8' : 'w-4 h-4'} />
                <span className="text-sm">Tirar Foto</span>
              </Button>
              <Button
                variant="outline"
                className={`${fotos.length === 0 ? 'h-32' : 'h-10'} border-dashed border-2 flex flex-col items-center justify-center gap-1 text-muted-foreground`}
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImagePlus className={fotos.length === 0 ? 'w-8 h-8' : 'w-4 h-4'} />
                <span className="text-sm">Galeria</span>
              </Button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoCapture}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoCapture}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Botão Confirmar */}
        <div className="sticky bottom-4">
          <Button
            onClick={confirmarColeta}
            disabled={saving || fotos.length === 0}
            className="w-full h-12 text-base"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirmar Coleta
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
