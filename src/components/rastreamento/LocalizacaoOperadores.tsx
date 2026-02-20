import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, Battery, Clock, X, Building2 } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const getInitials = (nome: string): string => {
  const parts = nome.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return nome.substring(0, 2).toUpperCase();
};

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

interface Empreendimento {
  id: string;
  nome: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
}

export default function LocalizacaoOperadores() {
  const [operadores, setOperadores] = useState<OperadorLocalizacao[]>([]);
  const [selectedOperador, setSelectedOperador] = useState<OperadorLocalizacao | null>(null);
  const [mapboxTokenMissing, setMapboxTokenMissing] = useState(false);
  const [showEmpreendimentos, setShowEmpreendimentos] = useState(false);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const empreendimentoMarkers = useRef<mapboxgl.Marker[]>([]);

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

  const fetchEmpreendimentos = async () => {
    const { data, error } = await supabase
      .from('empreendimentos_terceirizados')
      .select('id, nome, endereco, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      console.error('Erro ao buscar empreendimentos:', error);
      return;
    }

    if (data) {
      setEmpreendimentos(data as Empreendimento[]);
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

  // Operator markers
  useEffect(() => {
    if (!map.current) return;

    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    operadores.forEach((operador) => {
      const el = document.createElement('div');
      
      const minutosAtras = operador.segundos_desde_atualizacao / 60;
      let fillColor = '#22c55e';
      let opacity = '1';
      
      if (minutosAtras > 30) {
        fillColor = '#9ca3af';
        opacity = '0.6';
      } else if (minutosAtras > 10) {
        fillColor = '#eab308';
      }

      const initials = getInitials(operador.operador_nome);
      
      el.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" style="
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
          cursor: pointer;
          opacity: ${opacity};
        ">
          <path d="M24 46 L18 34 Q12 34 12 24 A12 12 0 1 1 36 24 Q36 34 30 34 Z" fill="${fillColor}" stroke="white" stroke-width="2.5"/>
          <circle cx="24" cy="22" r="10" fill="${fillColor}" stroke="white" stroke-width="2.5"/>
          <text x="24" y="26" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="Arial, sans-serif">${initials}</text>
        </svg>
      `;
      
      el.style.width = '48px';
      el.style.height = '48px';
      el.style.position = 'relative';
      el.style.zIndex = '10';
      el.title = operador.operador_nome;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
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

  // Empreendimento markers
  useEffect(() => {
    // Clear existing empreendimento markers
    empreendimentoMarkers.current.forEach(m => m.remove());
    empreendimentoMarkers.current = [];

    if (!showEmpreendimentos || !map.current) return;

    empreendimentos.forEach((emp) => {
      if (!emp.latitude || !emp.longitude) return;

      const el = document.createElement('div');
      el.innerHTML = `
        <svg width="40" height="48" viewBox="0 0 40 48" style="
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
          cursor: pointer;
        ">
          <!-- Diamond/building pin shape -->
          <path d="M20 46 L14 32 Q6 32 6 20 A14 14 0 1 1 34 20 Q34 32 26 32 Z" fill="#7c3aed" stroke="white" stroke-width="2.5"/>
          <!-- Inner circle -->
          <circle cx="20" cy="18" r="11" fill="#7c3aed" stroke="white" stroke-width="2.5"/>
          <!-- Building icon (simplified) -->
          <rect x="14" y="13" width="12" height="10" fill="white" rx="1"/>
          <rect x="16" y="15" width="2" height="2" fill="#7c3aed"/>
          <rect x="19" y="15" width="2" height="2" fill="#7c3aed"/>
          <rect x="22" y="15" width="2" height="2" fill="#7c3aed"/>
          <rect x="17" y="19" width="6" height="4" fill="#7c3aed" rx="0.5"/>
        </svg>
      `;

      el.style.width = '40px';
      el.style.height = '48px';
      el.title = emp.nome;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; min-width: 160px;">
            <p style="font-weight: 600; font-size: 13px; margin: 0 0 4px 0;">${emp.nome}</p>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">${emp.endereco}</p>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([emp.longitude, emp.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      empreendimentoMarkers.current.push(marker);
    });
  }, [showEmpreendimentos, empreendimentos]);

  // Toggle empreendimentos fetch
  useEffect(() => {
    if (showEmpreendimentos && empreendimentos.length === 0) {
      fetchEmpreendimentos();
    }
  }, [showEmpreendimentos]);

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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Operadores Ativos ({operadores.length})
          </h2>
        </div>

        {/* Toggle empreendimentos */}
        <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg border">
          <Building2 className="w-4 h-4 text-[#7c3aed]" />
          <Label htmlFor="toggle-empreendimentos" className="flex-1 text-sm cursor-pointer">
            Mostrar Empreendimentos
          </Label>
          <Switch
            id="toggle-empreendimentos"
            checked={showEmpreendimentos}
            onCheckedChange={setShowEmpreendimentos}
          />
        </div>

        {showEmpreendimentos && (
          <p className="text-xs text-muted-foreground px-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7c3aed] mr-1" />
            {empreendimentos.length} empreendimento{empreendimentos.length !== 1 ? 's' : ''} no mapa
          </p>
        )}
        
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
