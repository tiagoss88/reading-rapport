import { useEffect, useState } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'

export interface MaterialUsado { material_id: string; quantidade: string }
export interface MateriaisState { disponivel: boolean; semMaterial: boolean; itens: MaterialUsado[] }
interface Mat { id: string; nome: string; unidade: string; quantidade_padrao: number | null }

export default function MateriaisUtilizadosCard({ servicoId, value, onChange }: {
  servicoId: string; value: MateriaisState; onChange: (v: MateriaisState) => void
}) {
  const [mats, setMats] = useState<Mat[] | null>(null)
  const [novo, setNovo] = useState('')

  useEffect(() => {
    let vivo = true
    ;(supabase as any).rpc('listar_materiais_os', { p_servico_id: servicoId }).then(({ data, error }: { data: Mat[] | null; error: unknown }) => {
      if (!vivo) return
      if (error || !data || data.length === 0) { setMats([]); onChange({ disponivel: false, semMaterial: false, itens: [] }); return }
      setMats(data)
      onChange({
        disponivel: true, semMaterial: false,
        itens: data.filter((m) => m.quantidade_padrao).map((m) => ({ material_id: m.id, quantidade: String(m.quantidade_padrao) })),
      })
    })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicoId])

  if (!mats || mats.length === 0) return null
  const mapa = new Map(mats.map((m) => [m.id, m]))
  const livres = mats.filter((m) => !value.itens.some((i) => i.material_id === m.id))

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <Label className="flex items-center gap-1.5"><Package className="w-4 h-4" /> Materiais utilizados</Label>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={value.semMaterial} onCheckedChange={(c) => onChange({ ...value, semMaterial: !!c })} />
          Nenhum material utilizado
        </label>

        {!value.semMaterial && (
          <>
            {value.itens.length === 0 && <p className="text-xs text-muted-foreground">Adicione os materiais usados no serviço.</p>}
            {value.itens.map((i, idx) => {
              const m = mapa.get(i.material_id)
              return (
                <div key={i.material_id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate">{m?.nome ?? '—'}</span>
                  <Input className="h-9 w-20" inputMode="decimal" value={i.quantidade}
                    onChange={(e) => onChange({ ...value, itens: value.itens.map((x, j) => j === idx ? { ...x, quantidade: e.target.value } : x) })} />
                  <span className="text-xs text-muted-foreground w-8">{m?.unidade}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Remover"
                    onClick={() => onChange({ ...value, itens: value.itens.filter((_, j) => j !== idx) })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
            {livres.length > 0 && (
              <div className="flex gap-2">
                <Select value={novo} onValueChange={setNovo}>
                  <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Adicionar material" /></SelectTrigger>
                  <SelectContent>{livres.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" disabled={!novo}
                  onClick={() => { onChange({ ...value, itens: [...value.itens, { material_id: novo, quantidade: '1' }] }); setNovo('') }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
