import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Camera, X, Loader2, CheckCircle, Building2, User, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { smartCompress } from '@/lib/imageCompression'

interface ServicoData {
  id: string
  condominio_nome_original: string
  bloco: string | null
  apartamento: string | null
  morador_nome: string | null
  telefone: string | null
  email: string | null
  tipo_servico: string
  uf: string | null
  observacao: string | null
}

interface Props {
  servico: ServicoData
  operadorId: string
  onSuccess: () => void
  onCancel: () => void
}

interface FotoItem {
  file: File
  preview: string
}

const VALORES_PADRAO: Record<string, string> = {
  'religacao': '61.15',
  'religacao automatica': '61.15',
  'religacao emergencial': '88.94',
  'desligamento': '36.55',
  'visita tecnica': '88.94',
}

function getValorPadrao(tipo: string): string {
  const normalizado = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  return VALORES_PADRAO[normalizado] || ''
}

export default function ExecucaoServicoTerceirizado({ servico, operadorId, onSuccess, onCancel }: Props) {
  const { toast } = useToast()
  const [observacao, setObservacao] = useState('')
  const [fotos, setFotos] = useState<FotoItem[]>([])
  const [formaPagamento, setFormaPagamento] = useState('')
  const [valorServico, setValorServico] = useState(() => getValorPadrao(servico.tipo_servico))
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [saving, setSaving] = useState(false)

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getCanvasPoint = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasPoint(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasSignature(true)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasPoint(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDraw = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      try {
        const compressed = await smartCompress(file)
        const preview = URL.createObjectURL(compressed)
        setFotos(prev => [...prev, { file: compressed, preview }])
      } catch {
        setFotos(prev => [...prev, { file, preview: URL.createObjectURL(file) }])
      }
    }
    e.target.value = ''
  }

  const removeFoto = (index: number) => {
    setFotos(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadFile = async (file: File | Blob, name: string): Promise<string | null> => {
    const path = `servicos/${Date.now()}_${name}`
    const { error } = await supabase.storage.from('medidor-fotos').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('medidor-fotos').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Upload photos
      const fotoUrls: string[] = []
      for (const foto of fotos) {
        const url = await uploadFile(foto.file, foto.file.name)
        if (url) fotoUrls.push(url)
      }

      // Upload signature
      let assinaturaUrl: string | null = null
      if (hasSignature && canvasRef.current) {
        const blob = await new Promise<Blob | null>(resolve =>
          canvasRef.current!.toBlob(resolve, 'image/png')
        )
        if (blob) {
          assinaturaUrl = await uploadFile(blob, 'assinatura.png')
        }
      }

      // Build observacao with photos
      let obsText = observacao
      if (fotoUrls.length > 0) {
        obsText = `Fotos comprovante: ${fotoUrls.join(', ')}${obsText ? ` | Obs: ${obsText}` : ''}`
      }

      const turnoAtual = new Date().getHours() < 12 ? 'manha' : 'tarde'

      const updateData: Record<string, unknown> = {
        status_atendimento: 'executado',
        tecnico_id: operadorId,
        turno: turnoAtual,
        observacao: obsText || null,
        forma_pagamento: formaPagamento || null,
        valor_servico: valorServico ? parseFloat(valorServico.replace(',', '.')) : null,
        cpf_cnpj: cpfCnpj || null,
        assinatura_url: assinaturaUrl,
      }

      const { error } = await supabase
        .from('servicos_nacional_gas')
        .update(updateData)
        .eq('id', servico.id)

      if (error) throw error

      toast({ title: 'Serviço concluído', description: 'Registro salvo com sucesso.' })
      onSuccess()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Execução do Serviço</h1>
        </div>

        {/* Resumo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Resumo da Atividade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Badge className="text-xs">{servico.tipo_servico.toUpperCase()}</Badge>

            <div className="flex items-center gap-2 text-foreground">
              <Building2 className="w-4 h-4 shrink-0 text-primary" />
              <span className="font-medium">{servico.condominio_nome_original}</span>
            </div>
            {(servico.bloco || servico.apartamento) && (
              <p className="text-muted-foreground pl-6">
                {servico.bloco && `Bloco ${servico.bloco}`}
                {servico.bloco && servico.apartamento && ' - '}
                {servico.apartamento && `Apto ${servico.apartamento}`}
              </p>
            )}

            {servico.uf && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 text-primary" />
                <span>{servico.uf}</span>
              </div>
            )}

            {servico.morador_nome && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 shrink-0 text-primary" />
                <span>{servico.morador_nome}</span>
              </div>
            )}

            {servico.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <a href={`tel:${servico.telefone}`} className="text-primary font-medium hover:underline">{servico.telefone}</a>
              </div>
            )}

            {servico.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{servico.email}</span>
              </div>
            )}

            {servico.observacao && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <FileText className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span>{servico.observacao}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observação */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <Label>Observação</Label>
            <Textarea
              placeholder="Descreva o serviço realizado..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Label>Registro Fotográfico</Label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Camera className="w-4 h-4 mr-2" />Adicionar Foto
            </Button>
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden">
                    <img src={foto.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFoto(i)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fatura">Fatura</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor do Serviço (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0,00"
                value={valorServico}
                onChange={e => setValorServico(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input
                placeholder="000.000.000-00"
                value={cpfCnpj}
                onChange={e => setCpfCnpj(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Assinatura do Cliente</Label>
              {hasSignature && (
                <Button variant="ghost" size="sm" onClick={clearSignature}>Limpar</Button>
              )}
            </div>
            <div className="border rounded-md bg-white touch-none" style={{ height: 160 }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <p className="text-xs text-muted-foreground">Desenhe a assinatura no campo acima</p>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Concluir Serviço
        </Button>
      </div>
    </div>
  )
}
