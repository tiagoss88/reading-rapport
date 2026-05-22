import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Camera, Save, MapPin, User, Home, Image as ImageIcon, X } from 'lucide-react'
import { compressImage, isValidImageFile, getOptimalCompressionOptions } from '@/lib/imageCompression'
import { pickImagesMulti, takePhotoNative } from '@/lib/pickImages'
import { format } from 'date-fns'

interface Cliente {
  id: string
  identificacao_unidade: string
  nome?: string
  cpf?: string
  status: string
}

interface Empreendimento {
  id: string
  nome: string
  endereco: string
  tipo_gas?: string
}

export default function ColetorLeitura() {
  const { clienteId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const cliente = location.state?.cliente as Cliente
  const empreendimento = location.state?.empreendimento as Empreendimento
  const leituraExistente = location.state?.leituraExistente

  // Redirect if no data is available
  if (!cliente || !empreendimento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Dados não encontrados</p>
                <Button onClick={() => navigate('/coletor')}>
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Inicializar form com dados da leitura existente se estiver editando

  // Parse legacy observacao "Fotos comprovante: url1 | url2 | Obs: texto"
  const parseObservacao = (raw: string | null | undefined) => {
    if (!raw) return { urls: [] as string[], texto: '' }
    const m = raw.match(/^Fotos comprovante:\s*(.*?)(?:\s*\|\s*Obs:\s*([\s\S]*))?$/)
    if (!m) return { urls: [], texto: raw }
    const urls = m[1]
      .split(/\s*\|\s*/)
      .map(s => s.trim())
      .filter(u => /^https?:\/\//.test(u))
    return { urls, texto: (m[2] || '').trim() }
  }
  const parsedInicial = parseObservacao(leituraExistente?.observacao)
  const urlsExtras = parsedInicial.urls.filter(u => u !== leituraExistente?.foto_url)

  const [formData, setFormData] = useState({
    leitura_atual: leituraExistente?.leitura_atual?.toString() || '',
    observacao: parsedInicial.urls.length ? parsedInicial.texto : (leituraExistente?.observacao || ''),
    tipo_observacao: leituraExistente?.tipo_observacao || ''
  })
  const [fotos, setFotos] = useState<File[]>([])
  const [fotosPreview, setFotosPreview] = useState<string[]>(() => {
    const arr: string[] = []
    if (leituraExistente?.foto_url) arr.push(leituraExistente.foto_url)
    arr.push(...urlsExtras)
    return arr
  })
  // URLs já existentes (do banco) — não precisam re-upload
  const [fotosExistentes, setFotosExistentes] = useState<string[]>(() => {
    const arr: string[] = []
    if (leituraExistente?.foto_url) arr.push(leituraExistente.foto_url)
    arr.push(...urlsExtras)
    return arr
  })
  const [saving, setSaving] = useState(false)
  const [ultimaLeitura, setUltimaLeitura] = useState<number | null>(null)
  const [loadingUltimaLeitura, setLoadingUltimaLeitura] = useState(true)

  // Carregar a última leitura do cliente (da competência anterior)
  useEffect(() => {
    const carregarUltimaLeitura = async () => {
      try {
        // Calcular competência atual (YYYY/MM)
        const competenciaAtual = format(new Date(), 'yyyy/MM')
        
        let query = supabase
          .from('leituras')
          .select('leitura_atual')
          .eq('cliente_id', cliente.id)
          .lt('competencia', competenciaAtual)
          .order('competencia', { ascending: false })
          .order('data_leitura', { ascending: false })

        // Se estiver editando, excluir a leitura atual da busca
        if (leituraExistente) {
          query = query.neq('id', leituraExistente.id)
        }

        const { data, error } = await query.limit(1).maybeSingle()

        if (error) throw error
        
        if (data) {
          setUltimaLeitura(data.leitura_atual)
        }
      } catch (error) {
        console.error('Erro ao carregar última leitura:', error)
      } finally {
        setLoadingUltimaLeitura(false)
      }
    }

    if (cliente?.id) {
      carregarUltimaLeitura()
    }
  }, [cliente?.id, leituraExistente])

  // Calcular consumo
  const calcularConsumo = () => {
    if (!ultimaLeitura || !formData.leitura_atual) return null
    const consumo = parseFloat(formData.leitura_atual) - ultimaLeitura
    return consumo >= 0 ? consumo : null
  }

  const processarArquivos = async (arquivos: File[]) => {
    if (!arquivos.length) return
    const validos: File[] = []
    for (const file of arquivos) {
      if (!isValidImageFile(file)) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name}: selecione apenas imagens.`,
          variant: "destructive"
        })
        continue
      }
      try {
        const fileSizeKB = file.size / 1024
        const opts = getOptimalCompressionOptions(fileSizeKB)
        const comp = await compressImage(file, opts)
        validos.push(comp)
      } catch (err) {
        console.error('Erro ao comprimir:', err)
        validos.push(file)
      }
    }
    if (!validos.length) return
    setFotos(prev => [...prev, ...validos])
    const novos = await Promise.all(validos.map(f => new Promise<string>(res => {
      const r = new FileReader()
      r.onloadend = () => res(r.result as string)
      r.readAsDataURL(f)
    })))
    setFotosPreview(prev => [...prev, ...novos])
    toast({
      title: validos.length > 1 ? `${validos.length} fotos adicionadas` : 'Foto adicionada',
      description: 'Fotos prontas para envio.'
    })
  }

  const handleGaleria = async () => {
    try {
      const files = await pickImagesMulti()
      await processarArquivos(files)
    } catch (err) {
      console.error('Erro ao abrir galeria:', err)
      toast({ title: 'Erro', description: 'Falha ao abrir galeria.', variant: 'destructive' })
    }
  }

  const handleCamera = async () => {
    try {
      const f = await takePhotoNative()
      if (f) await processarArquivos([f])
    } catch (err) {
      console.error('Erro câmera:', err)
      toast({ title: 'Erro', description: 'Falha ao abrir câmera.', variant: 'destructive' })
    }
  }

  const removerFoto = (idx: number) => {
    const urlRemovida = fotosPreview[idx]
    setFotosPreview(prev => prev.filter((_, i) => i !== idx))
    // Se for URL existente (http), remover do array de existentes
    if (/^https?:\/\//.test(urlRemovida)) {
      setFotosExistentes(prev => prev.filter(u => u !== urlRemovida))
    } else {
      // É data URL de arquivo novo — descobrir índice correspondente em fotos
      const existentesNoPreview = fotosPreview.slice(0, idx).filter(u => !/^https?:\/\//.test(u)).length
      setFotos(prev => prev.filter((_, i) => i !== existentesNoPreview))
    }
  }

  const salvarLeitura = async () => {
    if (!formData.leitura_atual) {
      toast({
        title: "Erro",
        description: "A leitura atual é obrigatória",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      // Calcular competência (YYYY-MM)
      const competencia = format(new Date(), 'yyyy-MM')

      // Validar se já existe leitura na competência (apenas se não estiver editando)
      if (!leituraExistente) {
        const { data: leituraExistente, error: validacaoError } = await supabase
          .from('leituras')
          .select('id')
          .eq('cliente_id', cliente.id)
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
          setSaving(false)
          return
        }
      }
      // Upload de todas as fotos novas
      const novasUrls: string[] = []
      for (let i = 0; i < fotos.length; i++) {
        const f = fotos[i]
        const fileExt = f.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}_${i}.${fileExt}`
        const filePath = `leituras/${fileName}`
        const { error: uploadError } = await supabase.storage
          .from('medidor-fotos')
          .upload(filePath, f)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('medidor-fotos').getPublicUrl(filePath)
        novasUrls.push(data.publicUrl)
      }

      // URLs finais = existentes mantidas + novas
      const todasUrls = [...fotosExistentes, ...novasUrls]
      const fotoUrl = todasUrls[0] || null
      const urlsExtrasFinais = todasUrls.slice(1)

      // Monta observacao concatenada se houver fotos extras
      const obsTexto = formData.observacao || ''
      const observacaoFinal = urlsExtrasFinais.length
        ? `Fotos comprovante: ${urlsExtrasFinais.join(' | ')}${obsTexto ? ' | Obs: ' + obsTexto : ''}`
        : (obsTexto || null)

      // Buscar o operador atual (assumindo que está logado)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: operador } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!operador) throw new Error('Operador não encontrado')

      if (leituraExistente) {
        const { error } = await supabase
          .from('leituras')
          .update({
            leitura_atual: parseFloat(formData.leitura_atual),
            observacao: observacaoFinal,
            tipo_observacao: formData.tipo_observacao || null,
            foto_url: fotoUrl,
            data_leitura: new Date().toISOString(),
            competencia: format(new Date(), 'yyyy-MM')
          })
          .eq('id', leituraExistente.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('leituras')
          .insert({
            cliente_id: cliente.id,
            operador_id: operador.id,
            leitura_atual: parseFloat(formData.leitura_atual),
            observacao: observacaoFinal,
            tipo_observacao: formData.tipo_observacao || null,
            foto_url: fotoUrl,
            data_leitura: new Date().toISOString(),
            competencia,
            tipo_leitura: 'normal'
          })

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: leituraExistente ? "Leitura atualizada com sucesso!" : "Leitura registrada com sucesso!"
      })

      // Voltar para a lista de unidades
      navigate(`/coletor/unidades/${empreendimento.id}`, {
        state: { empreendimento }
      })

    } catch (error: any) {
      console.error('Erro ao salvar leitura:', error)
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar leitura",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const voltarParaUnidades = () => {
    navigate(`/coletor/unidades/${empreendimento.id}`, {
      state: { empreendimento }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3">
      <div className="max-w-md mx-auto space-y-3">
        {/* Header Compacto */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={voltarParaUnidades}
            className="flex-shrink-0 h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {leituraExistente ? 'Editar Leitura' : 'Nova Leitura'}
            </h1>
            <p className="text-xs text-gray-600 truncate">
              {cliente.identificacao_unidade}
            </p>
          </div>
        </div>

        {/* Informações da Unidade - Compacta */}
        <Card>
          <CardContent className="p-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <Home className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{cliente.identificacao_unidade}</span>
                </div>
              </div>
              {cliente.nome && (
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 truncate">{cliente.nome}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600 truncate">{empreendimento.nome}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Leitura - Layout Grid Compacto */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">
                {leituraExistente ? 'Editar Dados da Leitura' : 'Dados da Leitura'}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCamera}
                  className="flex items-center space-x-1 text-xs px-2 py-1 h-7 bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
                >
                  <Camera className="w-3 h-3" />
                  <span>Câmera</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGaleria}
                  className={`flex items-center space-x-1 text-xs px-2 py-1 h-7 ${
                    fotosPreview.length
                      ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Galeria{fotosPreview.length ? ` (${fotosPreview.length})` : ''}</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-2 gap-3">
              {/* Última Leitura */}
              <div className="col-span-2">
                <Label className="text-xs">Última Leitura (m³)</Label>
                <Input
                  value={loadingUltimaLeitura ? "Carregando..." : ultimaLeitura ? ultimaLeitura.toFixed(3) : "Primeira leitura"}
                  disabled
                  className="bg-gray-50 text-gray-600 h-8 text-xs"
                />
              </div>

              {/* Leitura Atual */}
              <div className="col-span-2">
                <Label htmlFor="leitura_atual" className="text-xs">Leitura Atual (m³) *</Label>
                <Input
                  id="leitura_atual"
                  type="number"
                  step="0.001"
                  value={formData.leitura_atual}
                  onChange={(e) => setFormData(prev => ({ ...prev, leitura_atual: e.target.value }))}
                  placeholder="Ex: 1234.567"
                  className="h-8 text-sm"
                />
              </div>

              {/* Consumo */}
              <div className="col-span-2">
                <Label className="text-xs">Consumo (m³)</Label>
                <Input
                  value={(() => {
                    const consumo = calcularConsumo()
                    if (consumo === null) return "N/A"
                    return consumo.toFixed(3)
                  })()}
                  disabled
                  className="bg-gray-50 text-gray-600 font-semibold h-8 text-xs"
                />
              </div>

              {/* Tipo de Observação */}
              <div className="col-span-2">
                <Label htmlFor="tipo_observacao" className="text-xs">Tipo de Observação</Label>
                <Select 
                  value={formData.tipo_observacao} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_observacao: value }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione se houver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leitura_normal">Leitura Normal</SelectItem>
                    <SelectItem value="medidor_danificado">Medidor Danificado</SelectItem>
                    <SelectItem value="local_inacessivel">Local Inacessível</SelectItem>
                    <SelectItem value="cliente_ausente">Cliente Ausente</SelectItem>
                    <SelectItem value="leitura_estimada">Leitura Estimada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div className="col-span-2">
                <Label htmlFor="observacao" className="text-xs">Observações</Label>
                <Textarea
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Observações adicionais (opcional)"
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input oculto para foto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFotoCapture}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Botão Salvar - Fixo no final */}
        <div className="sticky bottom-0 bg-gradient-to-br from-blue-50 to-indigo-100 pt-2">
          <Button
            onClick={salvarLeitura}
            disabled={saving || !formData.leitura_atual}
            className="w-full h-10 text-sm"
            size="sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {leituraExistente ? 'Atualizar Leitura' : 'Salvar Leitura'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}