export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  peso: number;
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

// Select initial centroids using k-means++ style (spread out)
function selectInitialCentroids(points: GeoPoint[], k: number): Centroid[] {
  const centroids: Centroid[] = [];
  
  // First centroid: random point
  const first = points[Math.floor(Math.random() * points.length)];
  centroids.push({ lat: first.lat, lng: first.lng });

  for (let i = 1; i < k; i++) {
    // Pick the point farthest from all existing centroids
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

export function optimizeRoutes(points: GeoPoint[], k: number): ClusterResult[] {
  if (points.length === 0 || k <= 0) return [];
  
  const effectiveK = Math.min(k, points.length);
  let centroids = selectInitialCentroids(points, effectiveK);
  const assignments = new Array<number>(points.length).fill(0);

  // Run 20 iterations of k-means
  for (let iter = 0; iter < 20; iter++) {
    // Assign each point to nearest centroid
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

    // Recalculate centroids
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
        newCentroids[c] = centroids[c]; // Keep old centroid if empty
      }
    }

    centroids = newCentroids;
  }

  // Sort clusters by longitude (west to east) and renumber 1..k
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
