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
}

export interface EstatisticaTecnico {
  operadorId: string
  operadorNome: string
  empreendimentoIds: string[]
  totalMedidores: number
}

export interface SugestaoResultado {
  porTecnico: EstatisticaTecnico[]
  semDistribuir: string[]
}

interface TecnicoInput {
  id: string
  nome: string
}

function distancia(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = a.lat - b.lat
  const dLng = a.lng - b.lng
  return dLat * dLat + dLng * dLng
}

// Escolhe k sementes usando farthest-first.
function farthestFirst(pontos: Array<{ id: string; lat: number; lng: number }>, k: number) {
  if (pontos.length === 0) return []
  const seeds = [pontos[0]]
  while (seeds.length < k && seeds.length < pontos.length) {
    let best = pontos[0]
    let bestDist = -1
    for (const p of pontos) {
      if (seeds.some(s => s.id === p.id)) continue
      const d = Math.min(...seeds.map(s => distancia(s, p)))
      if (d > bestDist) {
        bestDist = d
        best = p
      }
    }
    seeds.push(best)
  }
  return seeds.map(s => ({ lat: s.lat, lng: s.lng }))
}

function kmeansGeo(
  empreendimentos: EmpreendimentoInput[],
  k: number
): { clusters: string[][]; centroides: Array<{ lat: number; lng: number } | null> } {
  const comGeo = empreendimentos
    .filter(e => e.latitude != null && e.longitude != null)
    .map(e => ({ id: e.id, lat: Number(e.latitude), lng: Number(e.longitude) }))

  if (comGeo.length === 0) {
    return { clusters: Array.from({ length: k }, () => []), centroides: Array.from({ length: k }, () => null) }
  }

  let centroides = farthestFirst(comGeo, k)
  // Se houver menos pontos que k, replica o último
  while (centroides.length < k) centroides.push(centroides[centroides.length - 1])

  let assignments: number[] = comGeo.map(() => 0)

  for (let iter = 0; iter < 10; iter++) {
    const novas = comGeo.map(p => {
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < k; i++) {
        const d = distancia(p, centroides[i])
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

    // Recalcula centróides
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

function rebalancearPorMedidores(
  clusters: string[][],
  centroides: Array<{ lat: number; lng: number } | null>,
  mapa: Map<string, EmpreendimentoInput>
) {
  const totais = clusters.map(ids => totalMedidores(ids, mapa))
  const media = totais.reduce((a, b) => a + b, 0) / clusters.length
  const limite = Math.max(1, media * 0.15)

  for (let trocas = 0; trocas < 50; trocas++) {
    let maxIdx = 0
    let minIdx = 0
    clusters.forEach((_, i) => {
      if (totais[i] > totais[maxIdx]) maxIdx = i
      if (totais[i] < totais[minIdx]) minIdx = i
    })
    if (totais[maxIdx] - totais[minIdx] <= limite) break

    const centroMin = centroides[minIdx]
    if (!centroMin) break

    // Escolhe empreendimento do cluster pesado mais próximo do centróide leve
    const candidatos = clusters[maxIdx]
      .map(id => {
        const e = mapa.get(id)
        if (!e || e.latitude == null || e.longitude == null) return null
        return {
          id,
          medidores: e.quantidade_medidores,
          distMin: distancia({ lat: Number(e.latitude), lng: Number(e.longitude) }, centroMin),
        }
      })
      .filter((v): v is { id: string; medidores: number; distMin: number } => v !== null)
      .sort((a, b) => a.distMin - b.distMin)

    if (candidatos.length === 0) break

    // Não move se a troca inverter o desequilíbrio
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
  }
}

// Greedy LPT: maior medidor primeiro, sempre no cluster mais leve.
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
      })),
      semDistribuir: empreendimentos.map(e => e.id),
    }
  }

  const mapa = new Map(empreendimentos.map(e => [e.id, e]))
  let clusters: string[][]
  let centroides: Array<{ lat: number; lng: number } | null> = Array.from({ length: k }, () => null)

  if (opcoes.agruparProximidade) {
    const geoResult = kmeansGeo(empreendimentos, k)
    clusters = geoResult.clusters
    centroides = geoResult.centroides

    if (opcoes.balancearMedidores) {
      rebalancearPorMedidores(clusters, centroides, mapa)
    }

    // Distribui os sem geo no cluster mais leve
    const semGeo = empreendimentos.filter(e => e.latitude == null || e.longitude == null)
    for (const e of semGeo) {
      const totais = clusters.map(ids => totalMedidores(ids, mapa))
      let idx = 0
      for (let i = 1; i < k; i++) if (totais[i] < totais[idx]) idx = i
      clusters[idx].push(e.id)
    }
  } else if (opcoes.balancearMedidores) {
    clusters = greedyPorMedidores(empreendimentos, k)
  } else {
    // Sem critério: round-robin
    clusters = Array.from({ length: k }, () => [])
    empreendimentos.forEach((e, i) => clusters[i % k].push(e.id))
  }

  // Ordena clusters por latitude média (norte→sul) para casar com a ordem dos técnicos
  const ordemClusters = clusters
    .map((ids, i) => {
      const pontos = ids
        .map(id => mapa.get(id))
        .filter((e): e is EmpreendimentoInput => !!e && e.latitude != null)
      const latMedia = pontos.length
        ? pontos.reduce((a, e) => a + Number(e.latitude), 0) / pontos.length
        : 0
      return { i, latMedia }
    })
    .sort((a, b) => b.latMedia - a.latMedia)
    .map(x => x.i)

  const porTecnico: EstatisticaTecnico[] = tecnicos.map((t, ordem) => {
    const ids = clusters[ordemClusters[ordem]] || []
    return {
      operadorId: t.id,
      operadorNome: t.nome,
      empreendimentoIds: ids,
      totalMedidores: totalMedidores(ids, mapa),
    }
  })

  return { porTecnico, semDistribuir: [] }
}
