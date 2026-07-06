// Sugestão automática de divisão de empreendimentos entre técnicos.
// Funções puras — sem dependência de rede, banco ou React.

export interface EmpreendimentoInput {
  id: string
  nome: string
  quantidade_medidores: number
  latitude: number | null
  longitude: number | null
}

export interface SugestaoOpcoes {
  balancearMedidores: boolean
  agruparProximidade: boolean
  priorizarRegiao: boolean
}

export interface EstatisticaTecnico {
  operadorId: string
  operadorNome: string
  empreendimentoIds: string[]
  totalMedidores: number
  compactacaoKm: number
}

export interface SugestaoResultado {
  porTecnico: EstatisticaTecnico[]
  semCoordenadas: string[]
}

interface TecnicoInput {
  id: string
  nome: string
}

type Ponto = { id: string; lat: number; lng: number }
type Centroide = { lat: number; lng: number } | null

function dist2(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = a.lat - b.lat
  const dLng = a.lng - b.lng
  return dLat * dLat + dLng * dLng
}

// Sementes k-means++: primeira aleatória (determinística = índice 0),
// próximas com probabilidade proporcional ao quadrado da distância mínima.
function kmeansPlusPlus(pontos: Ponto[], k: number): Array<{ lat: number; lng: number }> {
  if (pontos.length === 0) return []
  const seeds: Array<{ lat: number; lng: number }> = [{ lat: pontos[0].lat, lng: pontos[0].lng }]

  while (seeds.length < k && seeds.length < pontos.length) {
    const distancias = pontos.map(p => Math.min(...seeds.map(s => dist2(s, p))))
    const total = distancias.reduce((a, b) => a + b, 0)
    if (total === 0) break
    // Escolha determinística: pega o ponto com maior d² ponderada acumulada no meio.
    // Usa amostragem por posição fixa (metade do peso total) — reprodutível.
    const alvo = total * 0.5
    let acc = 0
    let escolhido = pontos[0]
    for (let i = 0; i < pontos.length; i++) {
      acc += distancias[i]
      if (acc >= alvo) {
        escolhido = pontos[i]
        break
      }
    }
    if (seeds.some(s => s.lat === escolhido.lat && s.lng === escolhido.lng)) {
      // Fallback: escolhe o de maior distância
      let melhor = pontos[0]
      let melhorD = -1
      for (let i = 0; i < pontos.length; i++) {
        if (distancias[i] > melhorD) {
          melhorD = distancias[i]
          melhor = pontos[i]
        }
      }
      escolhido = melhor
    }
    seeds.push({ lat: escolhido.lat, lng: escolhido.lng })
  }

  return seeds
}

function kmeansGeo(
  empreendimentos: EmpreendimentoInput[],
  k: number
): { clusters: string[][]; centroides: Centroide[] } {
  const comGeo: Ponto[] = empreendimentos
    .filter(e => e.latitude != null && e.longitude != null)
    .map(e => ({ id: e.id, lat: Number(e.latitude), lng: Number(e.longitude) }))

  if (comGeo.length === 0) {
    return {
      clusters: Array.from({ length: k }, () => []),
      centroides: Array.from({ length: k }, () => null),
    }
  }

  let centroides = kmeansPlusPlus(comGeo, k)
  while (centroides.length < k) centroides.push(centroides[centroides.length - 1])

  let assignments: number[] = comGeo.map(() => 0)

  for (let iter = 0; iter < 15; iter++) {
    const novas = comGeo.map(p => {
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < k; i++) {
        const d = dist2(p, centroides[i])
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      }
      return best
    })

    const mudou = novas.some((a, i) => a !== assignments[i])
    assignments = novas
    if (!mudou) break

    const somas = Array.from({ length: k }, () => ({ lat: 0, lng: 0, n: 0 }))
    comGeo.forEach((p, i) => {
      const c = somas[assignments[i]]
      c.lat += p.lat
      c.lng += p.lng
      c.n += 1
    })
    centroides = somas.map((s, i) =>
      s.n > 0 ? { lat: s.lat / s.n, lng: s.lng / s.n } : centroides[i]
    )
  }

  const clusters: string[][] = Array.from({ length: k }, () => [])
  comGeo.forEach((p, i) => clusters[assignments[i]].push(p.id))
  return { clusters, centroides }
}

function totalMedidores(ids: string[], mapa: Map<string, EmpreendimentoInput>): number {
  return ids.reduce((acc, id) => acc + (mapa.get(id)?.quantidade_medidores || 0), 0)
}

function recalcCentroide(ids: string[], mapa: Map<string, EmpreendimentoInput>): Centroide {
  const pts = ids
    .map(id => mapa.get(id))
    .filter((e): e is EmpreendimentoInput => !!e && e.latitude != null && e.longitude != null)
  if (pts.length === 0) return null
  const lat = pts.reduce((a, e) => a + Number(e.latitude), 0) / pts.length
  const lng = pts.reduce((a, e) => a + Number(e.longitude), 0) / pts.length
  return { lat, lng }
}

// Rebalanceamento com restrição geográfica: só move um empreendimento se a distância
// ao novo centróide não for muito maior que a distância ao atual.
function rebalancearPorMedidores(
  clusters: string[][],
  centroides: Centroide[],
  mapa: Map<string, EmpreendimentoInput>,
  tolerancia: number,
  travaDistancia: number
) {
  const totais = clusters.map(ids => totalMedidores(ids, mapa))
  const media = totais.reduce((a, b) => a + b, 0) / clusters.length
  const limite = Math.max(1, media * tolerancia)

  for (let trocas = 0; trocas < 50; trocas++) {
    let maxIdx = 0
    let minIdx = 0
    clusters.forEach((_, i) => {
      if (totais[i] > totais[maxIdx]) maxIdx = i
      if (totais[i] < totais[minIdx]) minIdx = i
    })
    if (totais[maxIdx] - totais[minIdx] <= limite) break

    const cAtual = centroides[maxIdx]
    const cNovo = centroides[minIdx]
    if (!cAtual || !cNovo) break

    const candidatos = clusters[maxIdx]
      .map(id => {
        const e = mapa.get(id)
        if (!e || e.latitude == null || e.longitude == null) return null
        const p = { lat: Number(e.latitude), lng: Number(e.longitude) }
        const dAtual = Math.sqrt(dist2(p, cAtual))
        const dNovo = Math.sqrt(dist2(p, cNovo))
        return { id, medidores: e.quantidade_medidores, dAtual, dNovo }
      })
      .filter((v): v is { id: string; medidores: number; dAtual: number; dNovo: number } => v !== null)
      // Trava geográfica: só considera quem NÃO se afasta demais
      .filter(c => c.dNovo <= travaDistancia * Math.max(c.dAtual, 0.0001))
      // Prioriza os mais próximos do novo centróide
      .sort((a, b) => a.dNovo - b.dNovo)

    if (candidatos.length === 0) break

    const escolhido = candidatos.find(c => {
      const novoMax = totais[maxIdx] - c.medidores
      const novoMin = totais[minIdx] + c.medidores
      return Math.abs(novoMax - novoMin) < totais[maxIdx] - totais[minIdx]
    })
    if (!escolhido) break

    clusters[maxIdx] = clusters[maxIdx].filter(id => id !== escolhido.id)
    clusters[minIdx].push(escolhido.id)
    totais[maxIdx] -= escolhido.medidores
    totais[minIdx] += escolhido.medidores
    centroides[maxIdx] = recalcCentroide(clusters[maxIdx], mapa)
    centroides[minIdx] = recalcCentroide(clusters[minIdx], mapa)
  }
}

// Média das distâncias ao centróide (em km aprox: 1 grau ≈ 111 km).
function calcularCompactacao(ids: string[], mapa: Map<string, EmpreendimentoInput>): number {
  const pts = ids
    .map(id => mapa.get(id))
    .filter((e): e is EmpreendimentoInput => !!e && e.latitude != null && e.longitude != null)
    .map(e => ({ lat: Number(e.latitude), lng: Number(e.longitude) }))
  if (pts.length < 2) return 0
  const lat = pts.reduce((a, p) => a + p.lat, 0) / pts.length
  const lng = pts.reduce((a, p) => a + p.lng, 0) / pts.length
  const media =
    pts.reduce((a, p) => a + Math.sqrt(dist2(p, { lat, lng })), 0) / pts.length
  return media * 111
}

function greedyPorMedidores(empreendimentos: EmpreendimentoInput[], k: number): string[][] {
  const clusters: string[][] = Array.from({ length: k }, () => [])
  const totais = new Array(k).fill(0)
  const ordenados = [...empreendimentos].sort(
    (a, b) => b.quantidade_medidores - a.quantidade_medidores
  )
  for (const e of ordenados) {
    let idx = 0
    for (let i = 1; i < k; i++) if (totais[i] < totais[idx]) idx = i
    clusters[idx].push(e.id)
    totais[idx] += e.quantidade_medidores
  }
  return clusters
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
      })),
      semCoordenadas: empreendimentos.map(e => e.id),
    }
  }

  const mapa = new Map(empreendimentos.map(e => [e.id, e]))
  const comGeo = empreendimentos.filter(e => e.latitude != null && e.longitude != null)
  const semGeoIds = empreendimentos
    .filter(e => e.latitude == null || e.longitude == null)
    .map(e => e.id)

  let clusters: string[][]
  let centroides: Centroide[] = Array.from({ length: k }, () => null)

  if (opcoes.agruparProximidade) {
    const geoResult = kmeansGeo(comGeo, k)
    clusters = geoResult.clusters
    centroides = geoResult.centroides

    if (opcoes.balancearMedidores) {
      // Priorizar região = tolerância mais frouxa + trava geográfica apertada
      const tolerancia = opcoes.priorizarRegiao ? 0.4 : 0.25
      const travaDistancia = opcoes.priorizarRegiao ? 1.2 : 1.5
      rebalancearPorMedidores(clusters, centroides, mapa, tolerancia, travaDistancia)
    }
  } else if (opcoes.balancearMedidores) {
    clusters = greedyPorMedidores(comGeo, k)
  } else {
    clusters = Array.from({ length: k }, () => [])
    comGeo.forEach((e, i) => clusters[i % k].push(e.id))
  }

  // Distribui os sem coordenadas nos técnicos mais leves (sugestão inicial).
  for (const id of semGeoIds) {
    const totais = clusters.map(ids => totalMedidores(ids, mapa))
    let idx = 0
    for (let i = 1; i < k; i++) if (totais[i] < totais[idx]) idx = i
    clusters[idx].push(id)
  }

  // Ordena clusters por latitude média (norte→sul) e casa com a ordem dos técnicos
  const ordemClusters = clusters
    .map((ids, i) => {
      const c = recalcCentroide(ids, mapa)
      return { i, lat: c?.lat ?? 0 }
    })
    .sort((a, b) => b.lat - a.lat)
    .map(x => x.i)

  const porTecnico: EstatisticaTecnico[] = tecnicos.map((t, ordem) => {
    const ids = clusters[ordemClusters[ordem]] || []
    return {
      operadorId: t.id,
      operadorNome: t.nome,
      empreendimentoIds: ids,
      totalMedidores: totalMedidores(ids, mapa),
      compactacaoKm: calcularCompactacao(ids, mapa),
    }
  })

  return { porTecnico, semCoordenadas: semGeoIds }
}
