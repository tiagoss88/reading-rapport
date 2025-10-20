import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Battery, Clock } from 'lucide-react';

// Mapbox token from environment variable
// Add VITE_MAPBOX_TOKEN to your .env file with your Mapbox public token (pk.*)
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

export default function RastreamentoOperadores() {
  const [operadores, setOperadores] = useState<OperadorLocalizacao[]>([]);
  const [selectedOperador, setSelectedOperador] = useState<OperadorLocalizacao | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Buscar localizações dos operadores
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

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-46.6333, -23.5505], // São Paulo como centro padrão
      zoom: 12
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Atualizar marcadores no mapa
  useEffect(() => {
    if (!map.current) return;

    // Remover marcadores antigos
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Adicionar novos marcadores
    operadores.forEach((operador) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      
      // Cor baseada em tempo desde última atualização
      const minutosAtras = operador.segundos_desde_atualizacao / 60;
      if (minutosAtras < 10) {
        el.style.backgroundColor = '#22c55e'; // Verde - recente
      } else if (minutosAtras < 30) {
        el.style.backgroundColor = '#eab308'; // Amarelo - moderado
      } else {
        el.style.backgroundColor = '#ef4444'; // Vermelho - antigo
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

    // Ajustar bounds do mapa se houver operadores
    if (operadores.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      operadores.forEach(op => {
        bounds.extend([op.longitude, op.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [operadores]);

  // Buscar localizações ao montar e configurar auto-refresh
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Realtime subscription
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
    <Layout title="Rastreamento de Operadores">
      <div className="flex h-[calc(100vh-4rem)] gap-4">
        {/* Sidebar com lista de operadores */}
        <div className="w-80 overflow-auto space-y-3 p-4">
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

        {/* Mapa */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
          
          {selectedOperador && (
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
    </Layout>
  );
}
