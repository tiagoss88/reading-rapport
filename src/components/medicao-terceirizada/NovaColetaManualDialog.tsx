import { useState, useRef, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
// Select removed – using autocomplete input instead
import { supabase } from '@/integrations/supabase/client'
import { smartCompress } from '@/lib/imageCompression'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Upload, X } from 'lucide-react'
import { format } from 'date-fns'

interface NovaColetaManualDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function NovaColetaManualDialog({ open, onOpenChange, onSuccess }: NovaColetaManualDialogProps) {
  const [empreendimentoId, setEmpreendimentoId] = useState('')
  const [dataColeta, setDataColeta] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [texto, setTexto] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [buscaEmp, setBuscaEmp] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: empreendimentos } = useQuery({
    queryKey: ['empreendimentos-terceirizados-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .order('nome')
      if (error) throw error
      return data || []
    }
  })

  const empFiltrados = useMemo(() => {
    if (!empreendimentos) return []
    if (!buscaEmp) return empreendimentos
    return empreendimentos.filter(e => e.nome.toLowerCase().includes(buscaEmp.toLowerCase()))
  }, [empreendimentos, buscaEmp])

  const empSelecionado = empreendimentos?.find(e => e.id === empreendimentoId)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const compressed = await smartCompress(file)
        const fileName = `coleta_manual_${Date.now()}_${Math.random().toString(36).slice(2)}.${compressed.name.split('.').pop()}`
        const { error } = await supabase.storage.from('medidor-fotos').upload(fileName, compressed)
        if (error) throw error
        const { data: urlData } = supabase.storage.from('medidor-fotos').getPublicUrl(fileName)
        setFotos(prev => [...prev, urlData.publicUrl])
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar imagem')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setEmpreendimentoId('')
    setDataColeta(format(new Date(), 'yyyy-MM-dd'))
    setTexto('')
    setFotos([])
    setBuscaEmp('')
    setShowSuggestions(false)
  }

  const handleSave = async () => {
    if (!empreendimentoId || !empSelecionado) {
      toast.error('Selecione um condomínio')
      return
    }
    setSaving(true)
    try {
      const parts: string[] = []
      if (fotos.length === 1) {
        parts.push(`Foto comprovante: ${fotos[0]}`)
      } else if (fotos.length > 1) {
        parts.push(`Fotos comprovante: [${fotos.join(', ')}]`)
      }
      if (texto.trim()) parts.push(`Obs: ${texto.trim()}`)
      const observacao = parts.length ? parts.join(' | ') : null

      const { error } = await supabase.from('servicos_nacional_gas').insert({
        tipo_servico: 'leitura',
        status_atendimento: 'executado',
        condominio_nome_original: empSelecionado.nome,
        uf: empSelecionado.uf,
        empreendimento_id: empreendimentoId,
        data_agendamento: dataColeta,
        observacao,
        fonte: 'manual_admin'
      })
      if (error) throw error
      toast.success('Coleta manual registrada com sucesso')
      resetForm()
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao registrar coleta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Coleta Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Condomínio</Label>
            <Input
              placeholder="Buscar condomínio..."
              value={buscaEmp}
              onChange={e => setBuscaEmp(e.target.value)}
              className="mt-1 mb-1"
            />
            <Select value={empreendimentoId} onValueChange={setEmpreendimentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o condomínio" />
              </SelectTrigger>
              <SelectContent>
                {empFiltrados.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome} (Rota {e.rota} - {e.uf})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data da Coleta</Label>
            <Input type="date" value={dataColeta} onChange={e => setDataColeta(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Fotos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {fotos.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden border border-border">
                  <img src={url} alt="Foto" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFoto(i)}
                    className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <span className="text-xs">{uploading ? 'Enviando...' : 'Adicionar'}</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
          </div>

          <div>
            <Label htmlFor="obs-manual">Observação</Label>
            <Textarea
              id="obs-manual"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Observação da coleta..."
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || uploading || !empreendimentoId}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Coleta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
