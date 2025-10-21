import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Battery, Clock, X } from 'lucide-react';

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
  endereco_estimado?: string | null;
  precisao_rating?: string | null;
}

export default function LocalizacaoOperadores() {
  const [operadores, setOperadores] = useState<OperadorLocalizacao[]>([]);
  const [selectedOperador, setSelectedOperador] = useState<OperadorLocalizacao | null>(null);
  const [mapboxTokenMissing, setMapboxTokenMissing] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const circles = useRef<{ [key: string]: mapboxgl.Marker }>({});

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
    Object.values(circles.current).forEach(circle => circle.remove());
    markers.current = {};
    circles.current = {};

    operadores.forEach((operador) => {
      // Criar círculo de precisão
      const circleEl = document.createElement('div');
      const precisaoMetros = operador.precisao || 100;
      
      // Calcular o tamanho do círculo baseado no zoom e precisão
      const circleSize = Math.max(precisaoMetros / 2, 30);
      
      circleEl.style.width = `${circleSize}px`;
      circleEl.style.height = `${circleSize}px`;
      circleEl.style.borderRadius = '50%';
      circleEl.style.pointerEvents = 'none';
      
      // Cor do círculo baseado na precisão
      if (precisaoMetros < 50) {
        circleEl.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
        circleEl.style.border = '2px solid rgba(34, 197, 94, 0.4)';
      } else if (precisaoMetros < 100) {
        circleEl.style.backgroundColor = 'rgba(234, 179, 8, 0.15)';
        circleEl.style.border = '2px solid rgba(234, 179, 8, 0.4)';
      } else {
        circleEl.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        circleEl.style.border = '2px solid rgba(239, 68, 68, 0.4)';
      }

      const circle = new mapboxgl.Marker(circleEl)
        .setLngLat([operador.longitude, operador.latitude])
        .addTo(map.current!);
      
      circles.current[operador.operador_id] = circle;

      // Criar marcador do operador (técnico)
      const el = document.createElement('div');
      
      // Cor baseada na precisão GPS
      let fillColor = '#22c55e'; // Verde - Excelente
      if (precisaoMetros >= 100) {
        fillColor = '#ef4444'; // Vermelho - Ruim
      } else if (precisaoMetros >= 50) {
        fillColor = '#eab308'; // Amarelo - Aceitável
      }
      
      // Borda e opacidade baseada no status (tempo desde última atualização)
      const minutosAtras = operador.segundos_desde_atualizacao / 60;
      let borderColor = 'white'; // Online
      let opacity = '1';
      
      if (minutosAtras > 30) {
        borderColor = '#9ca3af'; // Cinza - Offline
        opacity = '0.6';
      } else if (minutosAtras > 10) {
        borderColor = '#f59e0b'; // Laranja - Ausente
      }
      
      // SVG de técnico/trabalhador com capacete
      el.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" style="
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          cursor: pointer;
          opacity: ${opacity};
        ">
          <!-- Círculo de fundo com borda -->
          <circle cx="12" cy="12" r="11" fill="${fillColor}" stroke="${borderColor}" stroke-width="2"/>
          
          <!-- Ícone de técnico/trabalhador -->
          <g transform="translate(12, 12)" fill="white">
            <!-- Capacete -->
            <path d="M-3,-6 Q-3,-8 0,-8 Q3,-8 3,-6 L3,-4 L-3,-4 Z"/>
            
            <!-- Cabeça -->
            <circle cx="0" cy="-2" r="2.5"/>
            
            <!-- Corpo -->
            <path d="M-2.5,0 L-2.5,4 L-1,6 L1,6 L2.5,4 L2.5,0 Z"/>
            
            <!-- Braços -->
            <path d="M-2.5,1 L-4,3 M2.5,1 L4,3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            
            <!-- Ferramenta (chave inglesa) -->
            <path d="M3,4 L5,6 M4.5,4.5 L3.5,5.5" stroke="white" stroke-width="1" stroke-linecap="round"/>
          </g>
        </svg>
      `;
      
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.position = 'relative';
      el.style.zIndex = '10';

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
                    <span>
                      Precisão: {operador.precisao?.toFixed(0)}m
                      {operador.precisao_rating && (
                        <Badge 
                          variant="outline" 
                          className="ml-2 text-xs"
                        >
                          {operador.precisao_rating === 'excelente' && '⭐ Excelente'}
                          {operador.precisao_rating === 'boa' && '✓ Boa'}
                          {operador.precisao_rating === 'aceitavel' && '~ Aceitável'}
                          {operador.precisao_rating === 'ruim' && '⚠ Ruim'}
                        </Badge>
                      )}
                    </span>
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
          <Card className="absolute top-4 left-4 z-10 w-80">
            <CardContent className="p-4 relative">
              <button
                onClick={() => setSelectedOperador(null)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="font-semibold mb-3">{selectedOperador.operador_nome}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p>{selectedOperador.operador_email}</p>
                </div>
                
                {selectedOperador.endereco_estimado && (
                  <div>
                    <span className="text-muted-foreground">Localização:</span>
                    <p className="text-xs mt-1">{selectedOperador.endereco_estimado}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-muted-foreground">Última atualização:</span>
                  <p>{formatTempoAtras(selectedOperador.segundos_desde_atualizacao)}</p>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Precisão GPS:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p>{selectedOperador.precisao?.toFixed(0)}m</p>
                    {selectedOperador.precisao_rating && (
                      <Badge variant="outline" className="text-xs">
                        {selectedOperador.precisao_rating === 'excelente' && '⭐ Excelente'}
                        {selectedOperador.precisao_rating === 'boa' && '✓ Boa'}
                        {selectedOperador.precisao_rating === 'aceitavel' && '~ Aceitável'}
                        {selectedOperador.precisao_rating === 'ruim' && '⚠ Ruim'}
                      </Badge>
                    )}
                  </div>
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
