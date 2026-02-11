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

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dlat = a.lat - b.lat;
  const dlng = a.lng - b.lng;
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

function selectInitialCentroids(points: GeoPoint[], k: number): Centroid[] {
  const centroids: Centroid[] = [];
  const first = points[Math.floor(Math.random() * points.length)];
  centroids.push({ lat: first.lat, lng: first.lng });

  for (let i = 1; i < k; i++) {
    let maxDist = -1;
    let bestPoint = points[0];
    for (const p of points) {
      const minDistToCentroid = Math.min(...centroids.map(c => distance(p, c)));
      if (minDistToCentroid > maxDist) {
        maxDist = minDistToCentroid;
        bestPoint = p;
      }
    }
    centroids.push({ lat: bestPoint.lat, lng: bestPoint.lng });
  }
  return centroids;
}

function rebalanceClusters(
  points: GeoPoint[],
  assignments: number[],
  centroids: Centroid[],
  metaMax: number
): void {
  const maxIterations = 500;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate peso per cluster
    const clusterPeso: Record<number, number> = {};
    for (let c = 0; c < centroids.length; c++) clusterPeso[c] = 0;
    for (let i = 0; i < points.length; i++) {
      clusterPeso[assignments[i]] = (clusterPeso[assignments[i]] || 0) + points[i].peso;
    }

    // Find most overloaded cluster
    let worstCluster = -1;
    let worstExcess = 0;
    for (let c = 0; c < centroids.length; c++) {
      const excess = clusterPeso[c] - metaMax;
      if (excess > worstExcess) {
        worstExcess = excess;
        worstCluster = c;
      }
    }

    if (worstCluster === -1) break; // All within limits

    // Collect points from overloaded cluster, sorted by peso ascending (smallest first)
    const candidateIndices = points
      .map((p, i) => ({ idx: i, peso: p.peso }))
      .filter(item => assignments[item.idx] === worstCluster)
      .sort((a, b) => a.peso - b.peso);

    let moved = false;
    for (const candidate of candidateIndices) {
      // Sort target clusters by distance (closest first)
      const targets = centroids
        .map((c, ci) => ({ ci, dist: distance(points[candidate.idx], c) }))
        .filter(t => t.ci !== worstCluster)
        .sort((a, b) => a.dist - b.dist);

      for (const target of targets) {
        if (clusterPeso[target.ci] + candidate.peso <= metaMax) {
          assignments[candidate.idx] = target.ci;
          moved = true;
          break; // Move one point per iteration cycle
        }
      }
      if (moved) break;
    }

    if (!moved) break; // No valid moves possible
  }

  // Second pass: aggressive rebalance ignoring geography if clusters still exceed metaMax
  for (let iter = 0; iter < maxIterations; iter++) {
    const clusterPeso: Record<number, number> = {};
    for (let c = 0; c < centroids.length; c++) clusterPeso[c] = 0;
    for (let i = 0; i < points.length; i++) {
      clusterPeso[assignments[i]] = (clusterPeso[assignments[i]] || 0) + points[i].peso;
    }

    let worstCluster = -1;
    let worstExcess = 0;
    for (let c = 0; c < centroids.length; c++) {
      const excess = clusterPeso[c] - metaMax;
      if (excess > worstExcess) {
        worstExcess = excess;
        worstCluster = c;
      }
    }

    if (worstCluster === -1) break;

    // Aggressive: find ANY point that fits in ANY cluster (ignore distance)
    const candidateIndices = points
      .map((p, i) => ({ idx: i, peso: p.peso }))
      .filter(item => assignments[item.idx] === worstCluster)
      .sort((a, b) => a.peso - b.peso);

    // Sort targets by available capacity (most room first)
    const targets = centroids
      .map((_, ci) => ({ ci, room: metaMax - clusterPeso[ci] }))
      .filter(t => t.ci !== worstCluster && t.room > 0)
      .sort((a, b) => b.room - a.room);

    let moved = false;
    for (const candidate of candidateIndices) {
      for (const target of targets) {
        if (clusterPeso[target.ci] + candidate.peso <= metaMax) {
          assignments[candidate.idx] = target.ci;
          moved = true;
          break;
        }
      }
      if (moved) break;
    }

    if (!moved) break;
  }
}

export function optimizeRoutes(
  points: GeoPoint[],
  k: number,
  metaMax?: number
): ClusterResult[] {
  if (points.length === 0 || k <= 0) return [];
  
  const effectiveK = Math.min(k, points.length);
  let centroids = selectInitialCentroids(points, effectiveK);
  const assignments = new Array<number>(points.length).fill(0);

  for (let iter = 0; iter < 20; iter++) {
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = distance(points[i], centroids[c]);
        if (d < minDist) {
          minDist = d;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }

    const newCentroids: Centroid[] = centroids.map(() => ({ lat: 0, lng: 0 }));
    const counts = new Array<number>(effectiveK).fill(0);

    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      newCentroids[c].lat += points[i].lat;
      newCentroids[c].lng += points[i].lng;
      counts[c]++;
    }

    for (let c = 0; c < effectiveK; c++) {
      if (counts[c] > 0) {
        newCentroids[c].lat /= counts[c];
        newCentroids[c].lng /= counts[c];
      } else {
        newCentroids[c] = centroids[c];
      }
    }
    centroids = newCentroids;
  }

  // Phase 2: Rebalance by peso if metaMax is provided
  if (metaMax && metaMax > 0) {
    rebalanceClusters(points, assignments, centroids, metaMax);
  }

  const clusterOrder = centroids
    .map((c, i) => ({ index: i, lng: c.lng }))
    .sort((a, b) => a.lng - b.lng);

  const reindex: Record<number, number> = {};
  clusterOrder.forEach((item, newIdx) => {
    reindex[item.index] = newIdx + 1;
  });

  return points.map((p, i) => ({
    id: p.id,
    rota: reindex[assignments[i]],
  }));
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

  // Agrupar por grupo (UF)
  const grupos: Record<string, GeoPoint[]> = {};
  for (const p of points) {
    const g = p.grupo || 'SEM_UF';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(p);
  }

  const allResults: ConstrainedClusterResult[] = [];
  let rotaOffset = 0;

  // Processar cada grupo separadamente
  const grupoKeys = Object.keys(grupos).sort();
  for (const grupo of grupoKeys) {
    const grupoPoints = grupos[grupo];
    const totalPeso = grupoPoints.reduce((sum, p) => sum + p.peso, 0);
    const k = Math.max(1, Math.ceil(totalPeso / metaPorRota));

    const results = optimizeRoutes(grupoPoints, k, metaMax);

    for (const r of results) {
      allResults.push({
        id: r.id,
        rota: r.rota + rotaOffset,
        grupo,
      });
    }

    rotaOffset += k;
  }

  return allResults;
}
