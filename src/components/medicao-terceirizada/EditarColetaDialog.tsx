import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { smartCompress } from '@/lib/imageCompression'
import { toast } from 'sonner'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'

interface Coleta {
  id: string
  observacao: string | null
  condominio_nome_original: string
  empreendimentos_terceirizados?: any
}

interface EditarColetaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coleta: Coleta | null
  onSuccess: () => void
}

function parseObservacao(obs: string | null): { fotos: string[]; texto: string } {
  if (!obs) return { fotos: [], texto: '' }

  let fotos: string[] = []
  let texto = obs

  // Parse "Fotos comprovante: [url1, url2] | Obs: texto"
  const matchMulti = obs.match(/Fotos comprovante: \[([^\]]*)\]/)
  if (matchMulti) {
    fotos = matchMulti[1].split(',').map(u => u.trim()).filter(Boolean)
    texto = obs.replace(/Fotos comprovante: \[[^\]]*\]\s*\|\s*Obs:\s*/, '').trim()
    if (texto === obs) {
      texto = obs.replace(/Fotos comprovante: \[[^\]]*\]/, '').replace(/^\s*\|\s*Obs:\s*/, '').trim()
    }
    return { fotos, texto }
  }

  // Parse "Foto comprovante: url | Obs: texto"
  const matchSingle = obs.match(/Foto comprovante: (.+?)(?:\s*\|\s*Obs:\s*(.*))?$/)
  if (matchSingle) {
    fotos = [matchSingle[1].trim()]
    texto = matchSingle[2]?.trim() || ''
    return { fotos, texto }
  }

  // Parse just "Foto comprovante: url"
  const matchFotoOnly = obs.match(/Foto comprovante: (.+)/)
  if (matchFotoOnly) {
    fotos = [matchFotoOnly[1].trim()]
    texto = ''
    return { fotos, texto }
  }

  return { fotos: [], texto: obs }
}

function buildObservacao(fotos: string[], texto: string): string {
  const parts: string[] = []
  if (fotos.length === 1) {
    parts.push(`Foto comprovante: ${fotos[0]}`)
  } else if (fotos.length > 1) {
    parts.push(`Fotos comprovante: [${fotos.join(', ')}]`)
  }
  if (texto.trim()) {
    parts.push(`Obs: ${texto.trim()}`)
  }
  return parts.join(' | ')
}

export default function EditarColetaDialog({ open, onOpenChange, coleta, onSuccess }: EditarColetaDialogProps) {
  const [fotos, setFotos] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (coleta && open) {
      const parsed = parseObservacao(coleta.observacao)
      setFotos(parsed.fotos)
      setTexto(parsed.texto)
    }
  }, [coleta, open])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const compressed = await smartCompress(file)
        const fileName = `coleta_${Date.now()}_${Math.random().toString(36).slice(2)}.${compressed.name.split('.').pop()}`
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

  const handleSave = async () => {
    if (!coleta) return
    setSaving(true)
    try {
      const novaObs = buildObservacao(fotos, texto)
      const { error } = await supabase
        .from('servicos_nacional_gas')
        .update({ observacao: novaObs || null })
        .eq('id', coleta.id)
      if (error) throw error
      toast.success('Coleta atualizada com sucesso')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const empNome = (coleta?.empreendimentos_terceirizados as any)?.nome || coleta?.condominio_nome_original || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Coleta - {empNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Fotos Comprovante</Label>
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
            <Label htmlFor="obs-texto">Observação</Label>
            <Textarea
              id="obs-texto"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Observação da coleta..."
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
