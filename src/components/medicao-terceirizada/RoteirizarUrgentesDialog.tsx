import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Loader2, Route as RouteIcon, MapPin, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { optimizeRoutesWithConstraints, GeoPoint } from '@/lib/routeOptimizer'

interface UrgenteItem {
  servico: {
    id: string
    empreendimento_id?: string | null
    condominio_nome_original: string
    bloco: string | null
    apartamento: string | null
    tipo_servico: string
    uf: string
  }
  diasRestantes: number
  semData: boolean
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  urgentes: UrgenteItem[]
  ufAtiva: string
}

const ROTA_COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7',
  '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#84CC16',
  '#F43F5E', '#0EA5E9', '#10B981', '#FBBF24', '#8B5CF6',
  '#DB2777', '#FB923C', '#2DD4BF', '#818CF8', '#A3E635',
]

function tempoRestante(dias: number, semData: boolean): string {
  if (semData) return 'Sem data'
  if (dias < 0) return `Vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoje'
  return `${dias}d úteis`
}

function distancia(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dx = a.lat - b.lat
  const dy = a.lng - b.lng
  return Math.sqrt(dx * dx + dy * dy)
}

export default function RoteirizarUrgentesDialog({ open, onOpenChange, urgentes, ufAtiva }: Props) {
  const { toast } = useToast()
  const [techs, setTechs] = useState<number>(2)
  const [gerado, setGerado] = useState(false)

  useEffect(() => {
    if (!open) setGerado(false)
  }, [open])

  const { data: empreendimentos, isLoading } = useQuery({
    queryKey: ['emp-terc-todos-coords'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('id, nome, uf, latitude, longitude, endereco')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
      if (error) throw error
      return data ?? []
    },
  })

  const normalizeName = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^ba\s+/, '')
      .replace(/\bcond(?:ominio|\.)?\s+/g, '')
      .replace(/\bresidencial\s+/g, '')
      .replace(/\bedificio\s+/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const empIndex = useMemo(() => {
    const byId = new Map<string, { lat: number; lng: number }>()
    const byKey = new Map<string, { lat: number; lng: number }>()
    const list: { uf: string; nomeNorm: string; lat: number; lng: number }[] = []
    for (const e of empreendimentos ?? []) {
      if (e.latitude == null || e.longitude == null) continue
      const coord = { lat: Number(e.latitude), lng: Number(e.longitude) }
      byId.set(e.id, coord)
      const uf = (e.uf || '').toUpperCase()
      const nomeNorm = normalizeName(e.nome || '')
      if (uf && nomeNorm) {
        byKey.set(`${uf}|${nomeNorm}`, coord)
        list.push({ uf, nomeNorm, lat: coord.lat, lng: coord.lng })
      }
    }
    return { byId, byKey, list }
  }, [empreendimentos])

  // Resolve por id -> nome exato normalizado -> match parcial (mesma UF)
  const resolveCoord = (u: UrgenteItem): { coord: { lat: number; lng: number } | null; via: 'id' | 'nome' | null } => {
    const id = u.servico.empreendimento_id
    if (id) {
      const c = empIndex.byId.get(id)
      if (c) return { coord: c, via: 'id' }
    }
    const uf = (u.servico.uf || '').toUpperCase()
    const nomeNorm = normalizeName(u.servico.condominio_nome_original)
    if (!uf || !nomeNorm) return { coord: null, via: null }
    const exato = empIndex.byKey.get(`${uf}|${nomeNorm}`)
    if (exato) return { coord: exato, via: 'nome' }
    // match parcial: um contém o outro
    for (const e of empIndex.list) {
      if (e.uf !== uf) continue
      if (e.nomeNorm.includes(nomeNorm) || nomeNorm.includes(e.nomeNorm)) {
        return { coord: { lat: e.lat, lng: e.lng }, via: 'nome' }
      }
    }
    return { coord: null, via: null }
  }

  const servicoCoords = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>()
    let porNome = 0
    for (const u of urgentes) {
      const r = resolveCoord(u)
      if (r.coord) {
        m.set(u.servico.id, r.coord)
        if (r.via === 'nome') porNome++
      }
    }
    return { map: m, porNome }
  }, [urgentes, empIndex])

  const comCoord = useMemo(
    () => urgentes.filter(u => servicoCoords.map.has(u.servico.id)),
    [urgentes, servicoCoords]
  )
  const semCoord = useMemo(
    () => urgentes.filter(u => !servicoCoords.map.has(u.servico.id)),
    [urgentes, servicoCoords]
  )


  const rotas = useMemo(() => {
    if (!gerado || comCoord.length === 0) return []

    // Agrupar por UF
    const porUf: Record<string, UrgenteItem[]> = {}
    for (const u of comCoord) {
      const uf = u.servico.uf || 'SEM_UF'
      if (!porUf[uf]) porUf[uf] = []
      porUf[uf].push(u)
    }

    const resultado: { rota: number; uf: string; cor: string; itens: UrgenteItem[] }[] = []
    let rotaOffset = 0

    for (const uf of Object.keys(porUf).sort()) {
      const items = porUf[uf]
      const points: GeoPoint[] = items.map(u => {
        const c = coordsMap.get(u.servico.empreendimento_id!)!
        return { id: u.servico.id, lat: c.lat, lng: c.lng, peso: 1, grupo: uf }
      })

      const kUf = Math.max(1, Math.min(techs, items.length))
      const metaPorRota = Math.ceil(items.length / kUf)
      const clusters = optimizeRoutesWithConstraints(points, metaPorRota)

      // Agrupar por rota
      const byRota: Record<number, UrgenteItem[]> = {}
      const itemById = new Map(items.map(i => [i.servico.id, i]))
      for (const c of clusters) {
        if (!byRota[c.rota]) byRota[c.rota] = []
        byRota[c.rota].push(itemById.get(c.id)!)
      }

      const rotasOrdenadas = Object.keys(byRota).map(Number).sort((a, b) => a - b)
      for (const r of rotasOrdenadas) {
        const lista = byRota[r]
        // Nearest-neighbor iniciando pelo mais urgente
        const restante = [...lista].sort((a, b) => a.diasRestantes - b.diasRestantes)
        const ordenado: UrgenteItem[] = []
        let atual = restante.shift()!
        ordenado.push(atual)
        while (restante.length) {
          const cAtual = coordsMap.get(atual.servico.empreendimento_id!)!
          let idxMin = 0
          let dMin = Infinity
          for (let i = 0; i < restante.length; i++) {
            const cx = coordsMap.get(restante[i].servico.empreendimento_id!)!
            const d = distancia(cAtual, cx)
            if (d < dMin) { dMin = d; idxMin = i }
          }
          atual = restante.splice(idxMin, 1)[0]
          ordenado.push(atual)
        }
        resultado.push({
          rota: rotaOffset + r,
          uf,
          cor: ROTA_COLORS[(rotaOffset + r - 1) % ROTA_COLORS.length],
          itens: ordenado,
        })
      }
      rotaOffset += kUf
    }
    return resultado
  }, [gerado, comCoord, techs, coordsMap])

  const formatLinhaItem = (u: UrgenteItem, i: number) => {
    const loc = [u.servico.bloco && `Bloco ${u.servico.bloco}`, u.servico.apartamento && `Apto ${u.servico.apartamento}`]
      .filter(Boolean).join(' ')
    const partes = [`[${u.servico.uf}]`, u.servico.condominio_nome_original, loc || null, u.servico.tipo_servico, tempoRestante(u.diasRestantes, u.semData)].filter(Boolean)
    return `${i + 1}. ${partes.join(' — ')}`
  }

  const textoRota = (r: typeof rotas[number]) =>
    [`🧑 Técnico ${r.rota} — ${r.uf} (${r.itens.length} serviços)`, ...r.itens.map(formatLinhaItem)].join('\n')

  const copiarRota = async (r: typeof rotas[number]) => {
    await navigator.clipboard.writeText(textoRota(r))
    toast({ title: 'Rota copiada!' })
  }

  const copiarTodas = async () => {
    const texto = rotas.map(textoRota).join('\n\n')
    await navigator.clipboard.writeText(texto)
    toast({ title: 'Todas as rotas copiadas!' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" /> Roteirizar Serviços Urgentes
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-end gap-3 border-b pb-3">
          <div className="space-y-1">
            <Label htmlFor="techs" className="text-xs">Quantidade de técnicos</Label>
            <Input
              id="techs"
              type="number"
              min={1}
              max={20}
              value={techs}
              onChange={e => setTechs(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="h-9 w-32"
            />
          </div>
          <div className="text-xs text-muted-foreground flex-1">
            <div>{urgentes.length} serviços na seleção {ufAtiva !== 'TODAS' && `(UF: ${ufAtiva})`}</div>
            <div>{comCoord.length} com geolocalização · {semCoord.length} sem coordenadas</div>
          </div>
          <Button
            onClick={() => setGerado(true)}
            disabled={isLoading || comCoord.length === 0}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RouteIcon className="h-4 w-4 mr-1" />}
            Gerar rotas
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {!gerado ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Escolha a quantidade de técnicos e clique em <b>Gerar rotas</b>.
            </div>
          ) : rotas.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum serviço com coordenadas disponíveis para roteirizar.
            </div>
          ) : (
            <div className="space-y-3 py-3">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={copiarTodas}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar todas as rotas
                </Button>
              </div>
              {rotas.map(r => (
                <Card key={r.rota} style={{ borderLeftColor: r.cor, borderLeftWidth: 4 }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" style={{ color: r.cor }} />
                        Técnico {r.rota} — {r.uf}
                        <Badge variant="secondary">{r.itens.length} serviços</Badge>
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => copiarRota(r)}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ol className="space-y-1 text-xs">
                      {r.itens.map((u, i) => (
                        <li key={u.servico.id} className="flex gap-2">
                          <span className="font-semibold text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                          <div className="flex-1">
                            <div className="font-medium">
                              {u.servico.condominio_nome_original}
                              {(u.servico.bloco || u.servico.apartamento) && (
                                <span className="text-muted-foreground font-normal">
                                  {' '}— {u.servico.bloco && `Bloco ${u.servico.bloco} `}{u.servico.apartamento && `Apto ${u.servico.apartamento}`}
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {u.servico.tipo_servico} · <span className="font-medium">{tempoRestante(u.diasRestantes, u.semData)}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
              {semCoord.length > 0 && (
                <Card className="border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Sem geolocalização — atribuir manualmente ({semCoord.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ol className="space-y-1 text-xs">
                      {semCoord.map((u, i) => (
                        <li key={u.servico.id}>
                          {i + 1}. [{u.servico.uf}] {u.servico.condominio_nome_original}
                          {u.servico.apartamento && ` — Apto ${u.servico.apartamento}`} · {u.servico.tipo_servico} · {tempoRestante(u.diasRestantes, u.semData)}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
