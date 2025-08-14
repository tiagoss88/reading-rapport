import { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Camera, Save, MapPin, User, Home } from 'lucide-react'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cliente = location.state?.cliente as Cliente
  const empreendimento = location.state?.empreendimento as Empreendimento

  const [formData, setFormData] = useState({
    leitura_atual: '',
    observacao: '',
    tipo_observacao: ''
  })
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [ultimaLeitura, setUltimaLeitura] = useState<number | null>(null)
  const [loadingUltimaLeitura, setLoadingUltimaLeitura] = useState(true)

  // Carregar a última leitura do cliente
  useEffect(() => {
    const carregarUltimaLeitura = async () => {
      try {
        const { data, error } = await supabase
          .from('leituras')
          .select('leitura_atual')
          .eq('cliente_id', cliente.id)
          .order('data_leitura', { ascending: false })
          .limit(1)
          .maybeSingle()

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
  }, [cliente?.id])

  // Calcular consumo
  const calcularConsumo = () => {
    if (!ultimaLeitura || !formData.leitura_atual) return null
    const consumo = parseFloat(formData.leitura_atual) - ultimaLeitura
    return consumo >= 0 ? consumo : null
  }

  const handleFotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const abrirCamera = () => {
    fileInputRef.current?.click()
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
      let fotoUrl = null

      // Upload da foto se existir
      if (foto) {
        const fileExt = foto.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `leituras/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('medidor-fotos')
          .upload(filePath, foto)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('medidor-fotos')
          .getPublicUrl(filePath)

        fotoUrl = urlData.publicUrl
      }

      // Buscar o operador atual (assumindo que está logado)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: operador } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!operador) throw new Error('Operador não encontrado')

      // Salvar a leitura
      const { error } = await supabase
        .from('leituras')
        .insert({
          cliente_id: cliente.id,
          operador_id: operador.id,
          leitura_atual: parseFloat(formData.leitura_atual),
          observacao: formData.observacao || null,
          tipo_observacao: formData.tipo_observacao || null,
          foto_url: fotoUrl,
          data_leitura: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Leitura registrada com sucesso!"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={voltarParaUnidades}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Nova Leitura</h1>
            <p className="text-sm text-gray-600">
              Registre a leitura do medidor
            </p>
          </div>
        </div>

        {/* Informações da Unidade */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Home className="w-4 h-4 mr-2 text-primary" />
              {cliente.identificacao_unidade}
            </CardTitle>
            <CardDescription className="space-y-1">
              {cliente.nome && (
                <div className="flex items-center text-sm">
                  <User className="w-3 h-3 mr-2" />
                  {cliente.nome}
                </div>
              )}
              <div className="flex items-center text-sm">
                <MapPin className="w-3 h-3 mr-2" />
                {empreendimento.nome}
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Formulário de Leitura */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Dados da Leitura</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={abrirCamera}
                className="flex items-center space-x-1"
              >
                <Camera className="w-4 h-4" />
                <span className="text-xs">Foto</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Última Leitura */}
            <div>
              <Label>Última Leitura (m³)</Label>
              <Input
                value={loadingUltimaLeitura ? "Carregando..." : ultimaLeitura ? ultimaLeitura.toFixed(3) : "Primeira leitura"}
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>

            {/* Leitura Atual */}
            <div>
              <Label htmlFor="leitura_atual">Leitura Atual (m³) *</Label>
              <Input
                id="leitura_atual"
                type="number"
                step="0.001"
                value={formData.leitura_atual}
                onChange={(e) => setFormData(prev => ({ ...prev, leitura_atual: e.target.value }))}
                placeholder="Ex: 1234.567"
                className="text-lg"
              />
            </div>

            {/* Consumo */}
            <div>
              <Label>Consumo (m³)</Label>
              <Input
                value={(() => {
                  const consumo = calcularConsumo()
                  if (consumo === null) return "N/A"
                  return consumo.toFixed(3)
                })()}
                disabled
                className="bg-gray-50 text-gray-600 font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="tipo_observacao">Tipo de Observação</Label>
              <Select 
                value={formData.tipo_observacao} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_observacao: value }))}
              >
                <SelectTrigger>
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

            <div>
              <Label htmlFor="observacao">Observações</Label>
              <Textarea
                id="observacao"
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                placeholder="Observações adicionais (opcional)"
                rows={2}
              />
            </div>

            {/* Preview da Foto */}
            {fotoPreview && (
              <div className="space-y-2">
                <Label>Foto Capturada</Label>
                <img 
                  src={fotoPreview} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input oculto para foto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFotoCapture}
          className="hidden"
        />

        {/* Botão Salvar */}
        <Button
          onClick={salvarLeitura}
          disabled={saving || !formData.leitura_atual}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Leitura
            </>
          )}
        </Button>
      </div>
    </div>
  )
}