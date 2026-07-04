export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  peso: number;
  grupo?: string;
}

export interface ClusterResult {
  id: string;
  rota: number;
}

interface Centroid {
  lat: number;
  lng: number;
}

// ------------------ Distância (Haversine em metros) ------------------
const EARTH_R = 6371000;
function toRad(v: number) { return (v * Math.PI) / 180; }

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ------------------ PRNG determinística (mulberry32) ------------------
function hashSeed(points: GeoPoint[]): number {
  let h = 2166136261 >>> 0;
  for (const p of points) {
    const s = p.id;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------ Inicialização k-means++ determinística ------------------
function selectInitialCentroids(points: GeoPoint[], k: number, rand: () => number): Centroid[] {
  const centroids: Centroid[] = [];
  const firstIdx = Math.floor(rand() * points.length);
  centroids.push({ lat: points[firstIdx].lat, lng: points[firstIdx].lng });

  for (let i = 1; i < k; i++) {
    const dists = points.map(p => {
      let m = Infinity;
      for (const c of centroids) {
        const d = distance(p, c);
        if (d < m) m = d;
      }
      return m * m * Math.max(1, p.peso);
    });
    const sum = dists.reduce((s, v) => s + v, 0);
    if (sum === 0) {
      // pontos duplicados — só pega qualquer um distinto
      centroids.push({ lat: points[i % points.length].lat, lng: points[i % points.length].lng });
      continue;
    }
    let r = rand() * sum;
    let chosen = 0;
    for (let j = 0; j < dists.length; j++) {
      r -= dists[j];
      if (r <= 0) { chosen = j; break; }
    }
    centroids.push({ lat: points[chosen].lat, lng: points[chosen].lng });
  }
  return centroids;
}

// ------------------ Rebalanceamento respeitando proximidade ------------------
function rebalanceClusters(
  points: GeoPoint[],
  assignments: number[],
  centroids: Centroid[],
  metaMax: number
): void {
  const metaMaxSoft = metaMax * 1.10;
  const maxIterations = 500;

  for (let iter = 0; iter < maxIterations; iter++) {
    const clusterPeso: number[] = new Array(centroids.length).fill(0);
    for (let i = 0; i < points.length; i++) {
      clusterPeso[assignments[i]] += points[i].peso;
    }

    // Cluster mais acima da meta
    let worstCluster = -1;
    let worstExcess = 0;
    for (let c = 0; c < centroids.length; c++) {
      const excess = clusterPeso[c] - metaMax;
      if (excess > worstExcess) { worstExcess = excess; worstCluster = c; }
    }
    if (worstCluster === -1) break;

    // Candidatos: pontos deste cluster, ordenados pela proximidade
    // do centroide alvo mais próximo (fronteira primeiro).
    const candidates = points
      .map((p, i) => {
        if (assignments[i] !== worstCluster) return null;
        let bestCi = -1;
        let bestD = Infinity;
        for (let ci = 0; ci < centroids.length; ci++) {
          if (ci === worstCluster) continue;
          const d = distance(p, centroids[ci]);
          if (d < bestD) { bestD = d; bestCi = ci; }
        }
        return { idx: i, targetCi: bestCi, targetDist: bestD };
      })
      .filter((v): v is { idx: number; targetCi: number; targetDist: number } => v !== null)
      .sort((a, b) => a.targetDist - b.targetDist);

    let moved = false;
    for (const cand of candidates) {
      const p = points[cand.idx];
      // Só move se caber (com folga soft) no cluster mais próximo
      if (clusterPeso[cand.targetCi] + p.peso <= metaMaxSoft) {
        assignments[cand.idx] = cand.targetCi;
        moved = true;
        break;
      }
    }
    if (!moved) break; // aceita folga soft em vez de misturar bairros
  }
}

// ------------------ Compactação: reduz outliers ------------------
function compactClusters(
  points: GeoPoint[],
  assignments: number[],
  centroids: Centroid[],
  metaMax?: number
): void {
  const metaMaxSoft = metaMax ? metaMax * 1.10 : Infinity;
  const maxPasses = 5;
  for (let pass = 0; pass < maxPasses; pass++) {
    const clusterPeso: number[] = new Array(centroids.length).fill(0);
    for (let i = 0; i < points.length; i++) clusterPeso[assignments[i]] += points[i].peso;

    let changed = false;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const currentCi = assignments[i];
      const currentD = distance(p, centroids[currentCi]);
      let bestCi = currentCi;
      let bestD = currentD;
      for (let ci = 0; ci < centroids.length; ci++) {
        if (ci === currentCi) continue;
        const d = distance(p, centroids[ci]);
        if (d < bestD && clusterPeso[ci] + p.peso <= metaMaxSoft) {
          bestD = d; bestCi = ci;
        }
      }
      if (bestCi !== currentCi && bestD < currentD * 0.85) {
        clusterPeso[currentCi] -= p.peso;
        clusterPeso[bestCi] += p.peso;
        assignments[i] = bestCi;
        changed = true;
      }
    }
    if (!changed) break;
  }
}

// ------------------ K-means (ponderado) ------------------
export function optimizeRoutes(
  points: GeoPoint[],
  k: number,
  metaMax?: number
): ClusterResult[] {
  if (points.length === 0 || k <= 0) return [];

  const effectiveK = Math.min(k, points.length);
  const rand = mulberry32(hashSeed(points) ^ effectiveK);
  let centroids = selectInitialCentroids(points, effectiveK, rand);
  const assignments = new Array<number>(points.length).fill(0);

  const maxIter = 50;
  for (let iter = 0; iter < maxIter; iter++) {
    let anyChanged = false;
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = distance(points[i], centroids[c]);
        if (d < minDist) { minDist = d; bestCluster = c; }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        anyChanged = true;
      }
    }

    // Centroide ponderado por peso
    const sumLat = new Array<number>(effectiveK).fill(0);
    const sumLng = new Array<number>(effectiveK).fill(0);
    const sumW = new Array<number>(effectiveK).fill(0);
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      const w = Math.max(1, points[i].peso);
      sumLat[c] += points[i].lat * w;
      sumLng[c] += points[i].lng * w;
      sumW[c] += w;
    }

    let maxShift = 0;
    const newCentroids: Centroid[] = centroids.map((old, c) => {
      if (sumW[c] === 0) return old;
      const nc = { lat: sumLat[c] / sumW[c], lng: sumLng[c] / sumW[c] };
      const shift = distance(old, nc);
      if (shift > maxShift) maxShift = shift;
      return nc;
    });
    centroids = newCentroids;

    if (!anyChanged || maxShift < 5) break;
  }

  // Rebalanceamento respeitando proximidade
  if (metaMax && metaMax > 0) {
    rebalanceClusters(points, assignments, centroids, metaMax);

    // Recalcula centroides após rebalance para compactar
    const sumLat = new Array<number>(effectiveK).fill(0);
    const sumLng = new Array<number>(effectiveK).fill(0);
    const sumW = new Array<number>(effectiveK).fill(0);
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      const w = Math.max(1, points[i].peso);
      sumLat[c] += points[i].lat * w;
      sumLng[c] += points[i].lng * w;
      sumW[c] += w;
    }
    centroids = centroids.map((old, c) =>
      sumW[c] > 0 ? { lat: sumLat[c] / sumW[c], lng: sumLng[c] / sumW[c] } : old
    );
  }

  // Compactação: puxa outliers para o cluster realmente mais próximo
  compactClusters(points, assignments, centroids, metaMax);

  // Numeração por varredura zigue-zague (norte→sul em faixas de longitude)
  const lats = centroids.map(c => c.lat);
  const lngs = centroids.map(c => c.lng);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const rangeLng = Math.max(1e-6, maxLng - minLng);
  const bands = Math.max(1, Math.min(effectiveK, Math.round(Math.sqrt(effectiveK))));
  const bandWidth = rangeLng / bands;

  const ordered = centroids
    .map((c, i) => {
      const band = Math.min(bands - 1, Math.floor((c.lng - minLng) / bandWidth));
      const latKey = band % 2 === 0 ? -c.lat : c.lat; // zigue-zague
      return { index: i, band, latKey };
    })
    .sort((a, b) => a.band - b.band || a.latKey - b.latKey);

  const reindex: Record<number, number> = {};
  ordered.forEach((item, newIdx) => { reindex[item.index] = newIdx + 1; });

  return points.map((p, i) => ({ id: p.id, rota: reindex[assignments[i]] }));
}

/**
 * Optimiza rotas respeitando regras de negócio:
 * - Separa por grupo (UF) — nunca mistura UFs
 * - Calcula automaticamente a quantidade de rotas com base na meta de medidores
 * - Retorna resultados com grupo preservado
 */
export interface ConstrainedClusterResult extends ClusterResult {
  grupo: string;
}

export function optimizeRoutesWithConstraints(
  points: GeoPoint[],
  metaPorRota: number,
  metaMax?: number
): ConstrainedClusterResult[] {
  if (points.length === 0) return [];

  const grupos: Record<string, GeoPoint[]> = {};
  for (const p of points) {
    const g = p.grupo || 'SEM_UF';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(p);
  }

  const allResults: ConstrainedClusterResult[] = [];
  let rotaOffset = 0;

  const grupoKeys = Object.keys(grupos).sort();
  for (const grupo of grupoKeys) {
    const grupoPoints = grupos[grupo];
    const totalPeso = grupoPoints.reduce((sum, p) => sum + p.peso, 0);
    const k = Math.max(1, Math.ceil(totalPeso / metaPorRota));

    const results = optimizeRoutes(grupoPoints, k, metaMax);

    for (const r of results) {
      allResults.push({ id: r.id, rota: r.rota + rotaOffset, grupo });
    }

    rotaOffset += k;
  }

  return allResults;
}
