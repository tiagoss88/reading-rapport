import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Building2, Gauge, Camera, CheckCircle, Navigation, MapPin, ImagePlus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { compressImage, isValidImageFile, getOptimalCompressionOptions } from '@/lib/imageCompression'
import { format } from 'date-fns'

export default function ColetorEmpreendimentoDetalhe() {
  const { empreendimentoId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
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
    const file = event.target.files?.[0]
    if (!file) return

    if (!isValidImageFile(file)) {
      toast({ title: "Arquivo inválido", description: "Selecione apenas arquivos de imagem.", variant: "destructive" })
      return
    }

    try {
      toast({ title: "Processando imagem...", description: "Otimizando a foto." })
      const fileSizeKB = file.size / 1024
      const compressionOptions = getOptimalCompressionOptions(fileSizeKB)
      const compressedFile = await compressImage(file, compressionOptions)

      setFoto(compressedFile)
      const reader = new FileReader()
      reader.onloadend = () => setFotoPreview(reader.result as string)
      reader.readAsDataURL(compressedFile)

      toast({ title: "Foto otimizada", description: `${fileSizeKB.toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB` })
    } catch {
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setFotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const confirmarColeta = async () => {
    if (!foto) {
      toast({ title: "Foto obrigatória", description: "Tire a foto do comprovante de sincronização antes de confirmar.", variant: "destructive" })
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

      // Upload foto
      const fileExt = foto.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `coletas/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('medidor-fotos')
        .upload(filePath, foto)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('medidor-fotos')
        .getPublicUrl(filePath)

      const dataHojeLocal = format(new Date(), 'yyyy-MM-dd')

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
          observacao: `Foto comprovante: ${urlData.publicUrl}`,
          data_agendamento: dataHojeLocal,
        })
      if (error) throw error

      // Best effort no cliente: backend continua sendo fonte da verdade
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
        console.warn('Nenhuma rota_leitura atualizada no coletor (possível RLS, rota inexistente ou já concluída).', {
          empreendimentoId,
          dataHojeLocal,
        })
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
        <p className="text-gray-500">Empreendimento não encontrado.</p>
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
            <h1 className="text-lg font-bold text-gray-900 truncate">{empreendimento.nome}</h1>
            <p className="text-xs text-gray-600">Detalhes do empreendimento</p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Medidores */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gauge className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{empreendimento.quantidade_medidores}</p>
                <p className="text-sm text-gray-500">medidores no condomínio</p>
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t pt-4">
              <div className="flex items-start space-x-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">{empreendimento.endereco}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://waze.com/ul?q=${enderecoEncoded}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Navigation className="w-3 h-3 mr-1" />
                    Waze
                  </Button>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    Google Maps
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Foto Comprovante */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Foto do comprovante de sincronização</p>

            {fotoPreview ? (
              <div className="space-y-3">
                <img
                  src={fotoPreview}
                  alt="Comprovante"
                  className="w-full rounded-lg border object-cover max-h-64"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Tirar Foto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Galeria
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-32 border-dashed border-2 flex flex-col items-center justify-center gap-2 text-gray-500"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">Tirar Foto</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-32 border-dashed border-2 flex flex-col items-center justify-center gap-2 text-gray-500"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-sm">Galeria</span>
                </Button>
              </div>
            )}

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
            disabled={saving || !foto}
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
