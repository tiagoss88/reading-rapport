// Sugestão automática de divisão de empreendimentos entre técnicos.
// Algoritmo: k-means++ ponderado por medidores + atribuição capacitada
// com distância Haversine (km reais). Roda várias inicializações e escolhe
// a partição com menor inércia ponderada.

export interface EmpreendimentoInput {
  id: string
  nome: string
  quantidade_medidores: number
  latitude: number | null
  longitude: number | null
}

export type ToleranciaBalanceamento = 'rigida' | 'media' | 'frouxa'

export interface SugestaoOpcoes {
  tolerancia: ToleranciaBalanceamento
}

export interface EstatisticaTecnico {
  operadorId: string
  operadorNome: string
  empreendimentoIds: string[]
  totalMedidores: number
  compactacaoKm: number
  raioMaxKm: number
}

export interface SugestaoResultado {
  porTecnico: EstatisticaTecnico[]
  semCoordenadas: string[]
}

interface TecnicoInput {
  id: string
  nome: string
}

type LatLng = { lat: number; lng: number }
type Ponto = { id: string; lat: number; lng: number; peso: number }

const R_KM = 6371
const N_INITS = 12
const MAX_ITER = 30

function toRad(g: number): number {
  return (g * Math.PI) / 180
}

function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)))
}

// Seleciona k sementes com k-means++ (aleatoriedade ponderada por d²·peso).
function kmeansPlusPlus(pontos: Ponto[], k: number): LatLng[] {
  if (pontos.length === 0) return []
  const first = pontos[Math.floor(Math.random() * pontos.length)]
  const seeds: LatLng[] = [{ lat: first.lat, lng: first.lng }]

  while (seeds.length < k && seeds.length < pontos.length) {
    const dists = pontos.map(p => {
      const d = Math.min(...seeds.map(s => haversineKm(s, p)))
      return d * d * Math.max(1, p.peso)
    })
    const total = dists.reduce((a, b) => a + b, 0)
    if (total === 0) break
    let r = Math.random() * total
    let idx = 0
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i]
      if (r <= 0) {
        idx = i
        break
      }
    }
    const p = pontos[idx]
    seeds.push({ lat: p.lat, lng: p.lng })
  }
  return seeds
}

// Centroide ponderado (média de lat/lng ponderada pelos medidores).
function centroidePonderado(pts: Ponto[]): LatLng | null {
  if (pts.length === 0) return null
  let wLat = 0
  let wLng = 0
  let w = 0
  for (const p of pts) {
    const peso = Math.max(1, p.peso)
    wLat += p.lat * peso
    wLng += p.lng * peso
    w += peso
  }
  return { lat: wLat / w, lng: wLng / w }
}

// Uma iteração completa: atribui pontos ao cluster mais próximo respeitando teto.
function atribuirCapacitado(
  pontos: Ponto[],
  centroides: LatLng[],
  teto: number
): number[] {
  const k = centroides.length
  const totais = new Array(k).fill(0)
  const assignments = new Array(pontos.length).fill(-1)

  // Ordena por medidores desc (aloca os "grandes" primeiro).
  const ordem = pontos
    .map((_, i) => i)
    .sort((a, b) => pontos[b].peso - pontos[a].peso)

  for (const i of ordem) {
    const p = pontos[i]
    const ranking = centroides
      .map((c, ci) => ({ ci, d: haversineKm(p, c) }))
      .sort((a, b) => a.d - b.d)

    let escolhido = -1
    for (const r of ranking) {
      if (totais[r.ci] + p.peso <= teto) {
        escolhido = r.ci
        break
      }
    }
    if (escolhido === -1) escolhido = ranking[0].ci // nenhum coube → mais próximo
    assignments[i] = escolhido
    totais[escolhido] += p.peso
  }
  return assignments
}

// Roda k-means capacitado com um teto; retorna clusters, centroides e inércia.
function rodadaCapacitada(
  pontos: Ponto[],
  k: number,
  teto: number
): { clusters: number[][]; centroides: LatLng[]; inercia: number } {
  let centroides = kmeansPlusPlus(pontos, k)
  while (centroides.length < k) {
    centroides.push(centroides[centroides.length - 1] || { lat: 0, lng: 0 })
  }

  let assignments: number[] = new Array(pontos.length).fill(-1)

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const novas = atribuirCapacitado(pontos, centroides, teto)
    const mudou = novas.some((a, i) => a !== assignments[i])
    assignments = novas
    if (!mudou && iter > 0) break

    const grupos: Ponto[][] = Array.from({ length: k }, () => [])
    assignments.forEach((c, i) => grupos[c].push(pontos[i]))
    centroides = grupos.map(
      (g, i) => centroidePonderado(g) || centroides[i]
    )
  }

  const clusters: number[][] = Array.from({ length: k }, () => [])
  assignments.forEach((c, i) => clusters[c].push(i))

  let inercia = 0
  clusters.forEach((idxs, ci) => {
    const c = centroides[ci]
    if (!c) return
    for (const i of idxs) {
      const p = pontos[i]
      const d = haversineKm(p, c)
      inercia += d * d * Math.max(1, p.peso)
    }
  })
  return { clusters, centroides, inercia }
}

function totalPeso(idxs: number[], pontos: Ponto[]): number {
  return idxs.reduce((a, i) => a + pontos[i].peso, 0)
}

function raioMaxKm(idxs: number[], pontos: Ponto[], c: LatLng | null): number {
  if (!c || idxs.length === 0) return 0
  let max = 0
  for (const i of idxs) {
    const d = haversineKm(pontos[i], c)
    if (d > max) max = d
  }
  return max
}

function compactacaoKm(idxs: number[], pontos: Ponto[], c: LatLng | null): number {
  if (!c || idxs.length < 2) return 0
  let soma = 0
  for (const i of idxs) soma += haversineKm(pontos[i], c)
  return soma / idxs.length
}

function toleranciaFrac(t: ToleranciaBalanceamento): number {
  if (t === 'rigida') return 0.1
  if (t === 'frouxa') return 0.3
  return 0.2
}

export function sugerirDivisao(params: {
  empreendimentos: EmpreendimentoInput[]
  tecnicos: TecnicoInput[]
  opcoes: SugestaoOpcoes
}): SugestaoResultado {
  const { empreendimentos, tecnicos, opcoes } = params
  const k = tecnicos.length

  if (k === 0 || empreendimentos.length === 0) {
    return {
      porTecnico: tecnicos.map(t => ({
        operadorId: t.id,
        operadorNome: t.nome,
        empreendimentoIds: [],
        totalMedidores: 0,
        compactacaoKm: 0,
        raioMaxKm: 0,
      })),
      semCoordenadas: empreendimentos.map(e => e.id),
    }
  }

  const pontos: Ponto[] = empreendimentos
    .filter(e => e.latitude != null && e.longitude != null)
    .map(e => ({
      id: e.id,
      lat: Number(e.latitude),
      lng: Number(e.longitude),
      peso: Math.max(1, Number(e.quantidade_medidores) || 1),
    }))

  const semGeoIds = empreendimentos
    .filter(e => e.latitude == null || e.longitude == null)
    .map(e => e.id)

  // Se há menos pontos com geo do que técnicos, cria clusters vazios para o restante.
  const kEfetivo = Math.min(k, Math.max(1, pontos.length))

  let melhor: { clusters: number[][]; centroides: LatLng[]; inercia: number } | null = null

  if (pontos.length > 0) {
    const somaPeso = pontos.reduce((a, p) => a + p.peso, 0)
    const media = somaPeso / kEfetivo
    const frac = toleranciaFrac(opcoes.tolerancia)

    for (let init = 0; init < N_INITS; init++) {
      let teto = Math.max(1, media * (1 + frac))
      let resultado = rodadaCapacitada(pontos, kEfetivo, teto)

      // Se algum cluster ficou vazio ou o teto foi violado seriamente,
      // relaxa o teto e refaz (até 4 tentativas).
      let tentativa = 0
      while (
        tentativa < 4 &&
        resultado.clusters.some(c => c.length === 0)
      ) {
        teto *= 1.15
        resultado = rodadaCapacitada(pontos, kEfetivo, teto)
        tentativa++
      }

      if (!melhor || resultado.inercia < melhor.inercia) {
        melhor = resultado
      }
    }
  }

  // Materializa clusters (por índice de técnico) — se kEfetivo < k, sobram vazios.
  const clustersIds: string[][] = Array.from({ length: k }, () => [])
  const centroidesCluster: (LatLng | null)[] = Array.from({ length: k }, () => null)

  if (melhor) {
    // Ordena clusters por (longitude, latitude) para casar em sequência visual O→L, N→S.
    const ordem = melhor.clusters
      .map((idxs, i) => ({ i, c: melhor!.centroides[i] }))
      .filter(x => x.c != null)
      .sort((a, b) => {
        const dLng = (a.c!.lng - b.c!.lng)
        if (Math.abs(dLng) > 0.2) return dLng
        return b.c!.lat - a.c!.lat
      })
      .map(x => x.i)

    ordem.forEach((clusterIdx, ordemIdx) => {
      const idxs = melhor!.clusters[clusterIdx]
      clustersIds[ordemIdx] = idxs.map(i => pontos[i].id)
      centroidesCluster[ordemIdx] = melhor!.centroides[clusterIdx]
    })
  }

  // Distribui os sem coordenadas no técnico com menor total atual.
  const totaisMedidores = clustersIds.map(ids =>
    ids.reduce(
      (a, id) => a + (empreendimentos.find(e => e.id === id)?.quantidade_medidores || 0),
      0
    )
  )
  for (const id of semGeoIds) {
    let idx = 0
    for (let i = 1; i < k; i++) if (totaisMedidores[i] < totaisMedidores[idx]) idx = i
    clustersIds[idx].push(id)
    const med = empreendimentos.find(e => e.id === id)?.quantidade_medidores || 0
    totaisMedidores[idx] += med
  }

  const porTecnico: EstatisticaTecnico[] = tecnicos.map((t, i) => {
    const ids = clustersIds[i] || []
    // Recalcula pontos do cluster (só os com geo) para métricas.
    const pts: Ponto[] = ids
      .map(id => {
        const e = empreendimentos.find(x => x.id === id)
        if (!e || e.latitude == null || e.longitude == null) return null
        return {
          id: e.id,
          lat: Number(e.latitude),
          lng: Number(e.longitude),
          peso: Math.max(1, e.quantidade_medidores || 1),
        }
      })
      .filter((p): p is Ponto => p !== null)
    const c = centroidePonderado(pts)
    const idxsLocais = pts.map((_, i) => i)
    return {
      operadorId: t.id,
      operadorNome: t.nome,
      empreendimentoIds: ids,
      totalMedidores: totaisMedidores[i],
      compactacaoKm: compactacaoKm(idxsLocais, pts, c),
      raioMaxKm: raioMaxKm(idxsLocais, pts, c),
    }
  })

  return { porTecnico, semCoordenadas: semGeoIds }
}
