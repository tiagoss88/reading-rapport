import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Battery, Clock } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface OperadorLocalizacao {
  id: string;
  operador_id: string;
  operador_nome: string;
  operador_email: string;
  latitude: number;
  longitude: number;
  precisao: number;
  timestamp: string;
  bateria_nivel: number | null;
  segundos_desde_atualizacao: number;
}

export default function LocalizacaoOperadores() {
  const [operadores, setOperadores] = useState<OperadorLocalizacao[]>([]);
  const [selectedOperador, setSelectedOperador] = useState<OperadorLocalizacao | null>(null);
  const [mapboxTokenMissing, setMapboxTokenMissing] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      setMapboxTokenMissing(true);
    }
  }, []);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('operadores_ultima_localizacao')
      .select('*');

    if (error) {
      console.error('Erro ao buscar localizações:', error);
      return;
    }

    if (data) {
      setOperadores(data as OperadorLocalizacao[]);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxgl.accessToken) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505],
        zoom: 12
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      setMapboxTokenMissing(true);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    operadores.forEach((operador) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      
      const minutosAtras = operador.segundos_desde_atualizacao / 60;
      if (minutosAtras < 10) {
        el.style.backgroundColor = '#22c55e';
      } else if (minutosAtras < 30) {
        el.style.backgroundColor = '#eab308';
      } else {
        el.style.backgroundColor = '#ef4444';
      }
      
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([operador.longitude, operador.latitude])
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        setSelectedOperador(operador);
      });

      markers.current[operador.operador_id] = marker;
    });

    if (operadores.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      operadores.forEach(op => {
        bounds.extend([op.longitude, op.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [operadores]);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('operador-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'operador_localizacoes'
        },
        () => {
          fetchLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTempoAtras = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}m atrás`;
    const horas = Math.floor(minutos / 60);
    return `${horas}h atrás`;
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      <div className="w-80 overflow-auto space-y-3">
        <h2 className="text-lg font-semibold mb-4">
          Operadores Ativos ({operadores.length})
        </h2>
        
        {operadores.map((operador) => {
          const minutosAtras = operador.segundos_desde_atualizacao / 60;
          let statusColor = 'bg-green-500';
          let statusText = 'Online';
          
          if (minutosAtras > 30) {
            statusColor = 'bg-red-500';
            statusText = 'Offline';
          } else if (minutosAtras > 10) {
            statusColor = 'bg-yellow-500';
            statusText = 'Ausente';
          }

          return (
            <Card
              key={operador.operador_id}
              className={`cursor-pointer transition-all ${
                selectedOperador?.operador_id === operador.operador_id
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
              onClick={() => setSelectedOperador(operador)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{operador.operador_nome}</h3>
                    <p className="text-xs text-muted-foreground">
                      {operador.operador_email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                    {statusText}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {formatTempoAtras(operador.segundos_desde_atualizacao)}
                  </div>
                  
                  {operador.bateria_nivel !== null && (
                    <div className="flex items-center gap-2">
                      <Battery className="w-3 h-3" />
                      {operador.bateria_nivel}%
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Precisão: {operador.precisao?.toFixed(0)}m
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {operadores.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum operador ativo</p>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        {mapboxTokenMissing ? (
          <Card className="absolute inset-0 flex items-center justify-center">
            <CardContent className="text-center p-8 max-w-md">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Token do Mapbox não configurado</h3>
              <p className="text-muted-foreground mb-4">
                Para usar o rastreamento, configure um token público do Mapbox.
              </p>
              <div className="bg-muted p-4 rounded-lg text-left text-sm space-y-2">
                <p className="font-medium">Como configurar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Acesse <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a></li>
                  <li>Copie seu token público (começa com pk.)</li>
                  <li>Adicione ao arquivo <code className="bg-background px-1 py-0.5 rounded">.env</code>:</li>
                </ol>
                <pre className="bg-background p-2 rounded mt-2 text-xs overflow-x-auto">
                  VITE_MAPBOX_TOKEN=seu_token_aqui
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
        )}
        
        {selectedOperador && !mapboxTokenMissing && (
          <Card className="absolute top-4 left-4 z-10 w-72">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{selectedOperador.operador_nome}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p>{selectedOperador.operador_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Última atualização:</span>
                  <p>{formatTempoAtras(selectedOperador.segundos_desde_atualizacao)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Coordenadas:</span>
                  <p className="text-xs">
                    {selectedOperador.latitude.toFixed(6)}, {selectedOperador.longitude.toFixed(6)}
                  </p>
                </div>
                {selectedOperador.bateria_nivel !== null && (
                  <div>
                    <span className="text-muted-foreground">Bateria:</span>
                    <p>{selectedOperador.bateria_nivel}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
