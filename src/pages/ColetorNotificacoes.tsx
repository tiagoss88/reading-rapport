import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowLeft, Bell, CalendarIcon, Camera, ImagePlus, X, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { smartCompress } from '@/lib/imageCompression'

interface FotoItem {
  file: File
  preview: string
}

export default function ColetorNotificacoes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [dataNotificacao, setDataNotificacao] = useState<Date>(new Date())
  const [condominioNome, setCondominioNome] = useState('')
  const [bloco, setBloco] = useState('')
  const [unidade, setUnidade] = useState('')
  const [observacao, setObservacao] = useState('')
  const [fotos, setFotos] = useState<FotoItem[]>([])
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const searchEmpreendimentos = async (term: string) => {
    if (term.length < 2) { setSuggestions([]); return }
    const { data } = await supabase
      .from('empreendimentos_terceirizados')
      .select('id, nome')
      .ilike('nome', `%${term}%`)
      .limit(5)
    setSuggestions(data || [])
    setShowSuggestions(true)
  }

  const handleFotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      try {
        const compressed = await smartCompress(file)
        setFotos(prev => [...prev, { file: compressed, preview: URL.createObjectURL(compressed) }])
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

  const handleSubmit = async () => {
    if (!condominioNome.trim() || !bloco.trim() || !unidade.trim()) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    if (fotos.length === 0) {
      toast({ title: 'Anexe pelo menos uma foto', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const fotoUrls: string[] = []
      for (const foto of fotos) {
        const fileName = `notificacoes/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        const { error: uploadError } = await supabase.storage.from('medidor-fotos').upload(fileName, foto.file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('medidor-fotos').getPublicUrl(fileName)
        fotoUrls.push(urlData.publicUrl)
      }

      const { error } = await supabase.from('notificacoes_medidores').insert({
        data_notificacao: format(dataNotificacao, 'yyyy-MM-dd'),
        condominio_nome: condominioNome.trim(),
        bloco: bloco.trim(),
        unidade: unidade.trim(),
        fotos: fotoUrls,
        observacao: observacao.trim() || null,
        operador_id: user?.id
      })

      if (error) throw error

      toast({ title: 'Notificação registrada com sucesso!' })
      navigate('/coletor')
    } catch (err: any) {
      toast({ title: 'Erro ao registrar', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/coletor')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <h1 className="text-lg font-bold text-gray-900">Nova Notificação</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Registrar Notificação de Medidor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data */}
            <div>
              <label className="text-sm font-medium">Data da Notificação *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataNotificacao, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataNotificacao} onSelect={d => d && setDataNotificacao(d)} className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Condomínio */}
            <div className="relative">
              <label className="text-sm font-medium">Condomínio *</label>
              <Input
                value={condominioNome}
                onChange={e => { setCondominioNome(e.target.value); searchEmpreendimentos(e.target.value) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Digite o nome do condomínio"
                className="mt-1"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s.id} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100" onClick={() => { setCondominioNome(s.nome); setShowSuggestions(false) }}>
                      {s.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bloco + Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Bloco *</label>
                <Input value={bloco} onChange={e => setBloco(e.target.value)} placeholder="Ex: A" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Unidade *</label>
                <Input value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: 101" className="mt-1" />
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="text-sm font-medium">Observação</label>
              <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observações..." rows={3} className="mt-1" />
            </div>

            {/* Fotos */}
            <div>
              <label className="text-sm font-medium">Fotos *</label>
              <p className="text-xs text-muted-foreground mb-2">Anexe a foto da notificação e do medidor</p>
              <div className="flex gap-2">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoCapture} />
                <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFotoCapture} />
                <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-1" /> Câmera
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-1" /> Galeria
                </Button>
              </div>
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {fotos.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={f.preview} alt="" className="w-full h-20 object-cover rounded border" />
                      <button onClick={() => removeFoto(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full" size="lg">
              <CheckCircle className="h-4 w-4 mr-2" />
              {saving ? 'Registrando...' : 'Registrar Notificação'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
