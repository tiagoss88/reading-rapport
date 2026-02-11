import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Route, Play, Save, Loader2, MapPin, Users, User } from 'lucide-react';
import { optimizeRoutesWithConstraints, GeoPoint, ConstrainedClusterResult } from '@/lib/routeOptimizer';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Empreendimento {
  id: string;
  nome: string;
  endereco: string;
  rota: number;
  uf: string;
  quantidade_medidores: number;
  latitude: number | null;
  longitude: number | null;
}

interface SimulationResult {
  rota: number;
  color: string;
  empreendimentos: Empreendimento[];
  totalMedidores: number;
  uf: string;
  dentroMeta: 'ok' | 'baixo' | 'alto';
  leituristas: number;
}

const ROTA_COLORS: Record<number, string> = {
  1: '#EF4444', 2: '#3B82F6', 3: '#22C55E', 4: '#EAB308', 5: '#A855F7',
  6: '#EC4899', 7: '#F97316', 8: '#14B8A6', 9: '#6366F1', 10: '#84CC16',
  11: '#F43F5E', 12: '#0EA5E9', 13: '#10B981', 14: '#FBBF24', 15: '#8B5CF6',
  16: '#DB2777', 17: '#FB923C', 18: '#2DD4BF', 19: '#818CF8', 20: '#A3E635',
};

function getMetaStatus(total: number, metaMin: number, metaMax: number): 'ok' | 'baixo' | 'alto' {
  if (total >= metaMin && total <= metaMax) return 'ok';
  if (total < metaMin) return 'baixo';
  return 'alto';
}

const Roteirizador = () => {
  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [selectedUf, setSelectedUf] = useState<string>('all');
  const [metaPorRota, setMetaPorRota] = useState<number>(750);
  const [leituristas, setLeituristas] = useState<number>(1);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [mapReady, setMapReady] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  const metaEfetiva = metaPorRota * leituristas;
  const metaMin = 700 * leituristas;
  const metaMax = 850 * leituristas;

  // Fetch Mapbox token
  const { data: mapboxConfig } = useQuery({
    queryKey: ['configuracao-mapbox'],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'mapbox_token')
        .maybeSingle();
      return data?.valor || null;
    }
  });

  useEffect(() => {
    if (mapboxConfig) {
      setMapboxToken(mapboxConfig);
    } else {
      const saved = localStorage.getItem('mapbox_token');
      if (saved) setMapboxToken(saved);
    }
  }, [mapboxConfig]);

  // Fetch empreendimentos
  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos-terceirizados-geo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .order('rota')
        .order('nome');
      if (error) throw error;
      return data as Empreendimento[];
    }
  });

  const ufsDisponiveis = [...new Set(empreendimentos.map(e => e.uf))].sort();

  const filteredEmpreendimentos = empreendimentos.filter(e => {
    const matchUf = selectedUf === 'all' || e.uf === selectedUf;
    return matchUf && e.latitude != null && e.longitude != null;
  });

  const nonGeoCount = empreendimentos.filter(e => {
    const matchUf = selectedUf === 'all' || e.uf === selectedUf;
    return matchUf && (e.latitude == null || e.longitude == null);
  }).length;

  const totalMedidoresFiltro = filteredEmpreendimentos.reduce((s, e) => s + e.quantidade_medidores, 0);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-38.5, -3.7],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.on('load', () => setMapReady(true));
  }, [mapboxToken]);

  useEffect(() => { initializeMap(); }, [initializeMap]);

  // Update markers
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredEmpreendimentos.forEach(emp => {
      if (!emp.latitude || !emp.longitude) return;

      const rota = assignments[emp.id] || emp.rota;
      const color = ROTA_COLORS[rota] || '#6B7280';
      const hasSimulation = Object.keys(assignments).length > 0;

      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 10 }).setHTML(`
        <div style="padding: 8px;">
          <strong style="color: ${color};">Rota ${rota}${hasSimulation ? ' (simulada)' : ''}</strong>
          <h3 style="margin: 4px 0; font-size: 14px;">${emp.nome}</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">${emp.endereco}</p>
          <p style="margin: 4px 0 0; font-size: 12px;"><strong>${emp.quantidade_medidores}</strong> medidores</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([emp.longitude, emp.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [filteredEmpreendimentos, assignments, mapReady]);

  useEffect(() => { updateMarkers(); }, [updateMarkers]);

  // Run simulation
  const handleSimulate = () => {
    if (filteredEmpreendimentos.length === 0) {
      toast.error('Nenhum empreendimento georreferenciado disponível para simulação.');
      return;
    }

    const points: GeoPoint[] = filteredEmpreendimentos.map(e => ({
      id: e.id,
      lat: e.latitude!,
      lng: e.longitude!,
      peso: e.quantidade_medidores,
      grupo: e.uf,
    }));

    const results = optimizeRoutesWithConstraints(points, metaEfetiva);

    const newAssignments: Record<string, number> = {};
    const grupoByRota: Record<number, string> = {};
    results.forEach(r => {
      newAssignments[r.id] = r.rota;
      grupoByRota[r.rota] = r.grupo;
    });
    setAssignments(newAssignments);

    // Build summary
    const grouped: Record<number, Empreendimento[]> = {};
    filteredEmpreendimentos.forEach(emp => {
      const rota = newAssignments[emp.id] || 1;
      if (!grouped[rota]) grouped[rota] = [];
      grouped[rota].push(emp);
    });

    const summary: SimulationResult[] = Object.entries(grouped)
      .map(([rota, emps]) => {
        const rotaNum = parseInt(rota);
        const totalMed = emps.reduce((sum, e) => sum + e.quantidade_medidores, 0);
        return {
          rota: rotaNum,
          color: ROTA_COLORS[rotaNum] || '#6B7280',
          empreendimentos: emps,
          totalMedidores: totalMed,
          uf: grupoByRota[rotaNum] || '',
          dentroMeta: getMetaStatus(totalMed, metaMin, metaMax),
          leituristas,
        };
      })
      .sort((a, b) => a.rota - b.rota);

    setSimulationResults(summary);
    toast.success(`Simulação concluída: ${summary.length} rotas criadas.`);

    // Fit map bounds
    if (map.current && filteredEmpreendimentos.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredEmpreendimentos.forEach(e => {
        if (e.latitude && e.longitude) bounds.extend([e.longitude, e.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  // Apply routes mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(assignments).map(([id, rota]) =>
        supabase.from('empreendimentos_terceirizados').update({ rota }).eq('id', id)
      );
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(`${errors.length} erros ao atualizar rotas`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-terceirizados-geo'] });
      toast.success('Rotas aplicadas com sucesso!');
      setSimulationResults([]);
      setAssignments({});
    },
    onError: (error) => {
      toast.error('Erro ao aplicar rotas: ' + error.message);
    },
  });

  const mediaPorRota = simulationResults.length > 0
    ? Math.round(simulationResults.reduce((s, r) => s + r.totalMedidores, 0) / simulationResults.length)
    : 0;

  return (
    <div className="h-[calc(100vh-180px)] flex gap-4">
      {/* Left Panel */}
      <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5" />
            Roteirizador
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Filtrar por UF</Label>
                <Select value={selectedUf} onValueChange={setSelectedUf}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={4} className="z-[200]">
                    <SelectItem value="all">Todos UFs</SelectItem>
                    {ufsDisponiveis.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Meta de medidores por rota</Label>
                <Input
                  type="number"
                  min={500}
                  max={1200}
                  value={metaPorRota}
                  onChange={(e) => setMetaPorRota(Math.max(500, Math.min(1200, parseInt(e.target.value) || 750)))}
                />
                <p className="text-xs text-muted-foreground mt-1">Faixa ideal: 700–850</p>
              </div>

              <div>
                <Label className="text-sm">Leituristas por rota</Label>
                <Select value={String(leituristas)} onValueChange={(v) => setLeituristas(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={4} className="z-[200]">
                    <SelectItem value="1">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> 1 leiturista</span>
                    </SelectItem>
                    <SelectItem value="2">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 2 leituristas</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {leituristas === 2 && (
                  <p className="text-xs text-muted-foreground mt-1">Meta efetiva: {metaEfetiva} medidores/rota</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {filteredEmpreendimentos.length} com GPS
                </Badge>
                <Badge variant="outline">
                  {totalMedidoresFiltro} medidores
                </Badge>
                {nonGeoCount > 0 && (
                  <Badge variant="outline" className="text-destructive">
                    {nonGeoCount} sem GPS
                  </Badge>
                )}
              </div>

              <Button onClick={handleSimulate} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Calcular Rotas
              </Button>

              {simulationResults.length > 0 && (
                <>
                  <Separator />

                  <div className="p-2 rounded-md bg-muted text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de rotas</span>
                      <span className="font-medium">{simulationResults.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Média por rota</span>
                      <span className="font-medium">{mediaPorRota} med.</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {simulationResults.map(result => (
                      <div
                        key={result.rota}
                        className="flex items-center gap-3 p-2 rounded-md border"
                        style={{ borderLeftColor: result.color, borderLeftWidth: 4 }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-1">
                            Rota {result.rota}
                            <span className="text-xs text-muted-foreground">({result.uf})</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{result.empreendimentos.length} emprend.</span>
                            <span>·</span>
                            <Badge
                              variant={result.dentroMeta === 'ok' ? 'default' : 'outline'}
                              className={
                                result.dentroMeta === 'ok'
                                  ? 'bg-green-600 text-white text-[10px] px-1.5 py-0'
                                  : result.dentroMeta === 'baixo'
                                  ? 'border-yellow-500 text-yellow-600 text-[10px] px-1.5 py-0'
                                  : 'border-red-500 text-red-600 text-[10px] px-1.5 py-0'
                              }
                            >
                              {result.totalMedidores} med.
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-muted-foreground" title={`${result.leituristas} leiturista(s)`}>
                          {result.leituristas === 2 ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full" variant="default" disabled={applyMutation.isPending}>
                        {applyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Aplicar Rotas
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Aplicar rotas simuladas?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá substituir as rotas atuais de {Object.keys(assignments).length} empreendimentos
                          pelas rotas geradas na simulação. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => applyMutation.mutate()}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="flex-1 overflow-hidden">
        {mapboxToken ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Configure o token do Mapbox na aba Georreferenciamento</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Roteirizador;
