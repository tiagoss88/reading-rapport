import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Search, Navigation2, Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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

// Paleta de cores para as 20 rotas
const ROTA_COLORS: Record<number, string> = {
  1: '#EF4444', 2: '#3B82F6', 3: '#22C55E', 4: '#EAB308', 5: '#A855F7',
  6: '#EC4899', 7: '#F97316', 8: '#14B8A6', 9: '#6366F1', 10: '#84CC16',
  11: '#F43F5E', 12: '#0EA5E9', 13: '#10B981', 14: '#FBBF24', 15: '#8B5CF6',
  16: '#DB2777', 17: '#FB923C', 18: '#2DD4BF', 19: '#818CF8', 20: '#A3E635',
};

const GeorreferenciamentoTerceirizado = () => {
  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [selectedUf, setSelectedUf] = useState<string>('all');
  const [selectedRota, setSelectedRota] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<Empreendimento | null>(null);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // Buscar token do Mapbox do banco de dados
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

  // Buscar empreendimentos
  const { data: empreendimentos = [], isLoading } = useQuery({
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

  // UFs disponíveis
  const ufsDisponiveis = [...new Set(empreendimentos.map(e => e.uf))].sort();
  
  // Rotas disponíveis
  const rotasDisponiveis = [...new Set(empreendimentos.map(e => e.rota))].sort((a, b) => a - b);

  // Filtrar empreendimentos
  const filteredEmpreendimentos = empreendimentos.filter(e => {
    const matchUf = selectedUf === 'all' || e.uf === selectedUf;
    const matchRota = selectedRota === 'all' || e.rota === parseInt(selectedRota);
    const matchSearch = !searchTerm || 
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.endereco.toLowerCase().includes(searchTerm.toLowerCase());
    return matchUf && matchRota && matchSearch;
  });

  // Agrupar por rota
  const groupedByRota = filteredEmpreendimentos.reduce((acc, emp) => {
    if (!acc[emp.rota]) acc[emp.rota] = [];
    acc[emp.rota].push(emp);
    return acc;
  }, {} as Record<number, Empreendimento[]>);

  // Estatísticas
  const totalFiltered = filteredEmpreendimentos.length;
  const totalGeoreferenced = filteredEmpreendimentos.filter(e => e.latitude && e.longitude).length;

  // Mutation para salvar coordenadas
  const saveMutation = useMutation({
    mutationFn: async ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
      const { error } = await supabase
        .from('empreendimentos_terceirizados')
        .update({ latitude, longitude })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-terceirizados-geo'] });
      toast.success('Localização salva com sucesso!');
      setSelectedEmpreendimento(null);
      setEditLat('');
      setEditLng('');
    },
    onError: (error) => {
      toast.error('Erro ao salvar localização: ' + error.message);
    }
  });

  // Geocodificar endereço
  const geocodeAddress = async (address: string) => {
    if (!mapboxToken) {
      toast.error('Token do Mapbox não configurado');
      return null;
    }
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&country=BR&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
      return null;
    } catch (error) {
      console.error('Erro ao geocodificar:', error);
      return null;
    }
  };

  // Inicializar mapa
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-38.5, -3.7], // Centro de Fortaleza/CE
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapReady(true);
    });

    // Click no mapa para definir coordenadas
    map.current.on('click', (e) => {
      if (selectedEmpreendimento) {
        setEditLat(e.lngLat.lat.toFixed(6));
        setEditLng(e.lngLat.lng.toFixed(6));
      }
    });
  }, [mapboxToken, selectedEmpreendimento]);

  // Atualizar marcadores
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapReady) return;

    // Remover marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Adicionar novos marcadores
    filteredEmpreendimentos.forEach(emp => {
      if (emp.latitude && emp.longitude) {
        const color = ROTA_COLORS[emp.rota] || '#6B7280';
        
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        
        if (selectedEmpreendimento?.id === emp.id) {
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.border = '4px solid #000';
        }

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong style="color: ${color};">Rota ${emp.rota}</strong>
            <h3 style="margin: 4px 0; font-size: 14px;">${emp.nome}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${emp.endereco}</p>
            <p style="margin: 4px 0 0; font-size: 12px;"><strong>${emp.quantidade_medidores}</strong> medidores</p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([emp.longitude, emp.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          selectEmpreendimento(emp);
        });

        markersRef.current.push(marker);
      }
    });
  }, [filteredEmpreendimentos, selectedEmpreendimento, mapReady]);

  // Efeito para inicializar mapa
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Efeito para atualizar marcadores
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Selecionar empreendimento
  const selectEmpreendimento = (emp: Empreendimento) => {
    setSelectedEmpreendimento(emp);
    setEditLat(emp.latitude?.toString() || '');
    setEditLng(emp.longitude?.toString() || '');
    
    if (map.current && emp.latitude && emp.longitude) {
      map.current.flyTo({
        center: [emp.longitude, emp.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  };

  // Geocodificar empreendimento selecionado
  const handleGeocode = async () => {
    if (!selectedEmpreendimento) return;
    
    setIsGeocoding(true);
    const result = await geocodeAddress(selectedEmpreendimento.endereco + ', ' + selectedEmpreendimento.uf + ', Brasil');
    setIsGeocoding(false);
    
    if (result) {
      setEditLat(result.lat.toFixed(6));
      setEditLng(result.lng.toFixed(6));
      
      if (map.current) {
        map.current.flyTo({
          center: [result.lng, result.lat],
          zoom: 15,
          duration: 1000
        });
      }
      
      toast.success('Endereço geocodificado! Verifique no mapa e salve.');
    } else {
      toast.error('Não foi possível encontrar o endereço. Clique no mapa para definir manualmente.');
    }
  };

  // Salvar localização
  const handleSave = () => {
    if (!selectedEmpreendimento || !editLat || !editLng) {
      toast.error('Defina latitude e longitude antes de salvar');
      return;
    }
    
    saveMutation.mutate({
      id: selectedEmpreendimento.id,
      latitude: parseFloat(editLat),
      longitude: parseFloat(editLng)
    });
  };

  // Confirmar token do Mapbox
  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      localStorage.setItem('mapbox_token', tokenInput.trim());
    }
  };

  // Carregar token: prioridade banco de dados > localStorage > input manual
  useEffect(() => {
    if (mapboxConfig) {
      setMapboxToken(mapboxConfig);
    } else {
      const savedToken = localStorage.getItem('mapbox_token');
      if (savedToken) {
        setMapboxToken(savedToken);
      }
    }
  }, [mapboxConfig]);

  return (
    <Layout title="Georreferenciamento">
      <div className="h-[calc(100vh-120px)] flex gap-4">
        {/* Painel Esquerdo */}
        <Card className="w-80 flex-shrink-0 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation2 className="h-5 w-5" />
              Empreendimentos
            </CardTitle>
            
            {/* Filtros */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <Select value={selectedUf} onValueChange={setSelectedUf}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={4} className="z-[200]">
                    <SelectItem value="all">Todos UFs</SelectItem>
                    {ufsDisponiveis.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedRota} onValueChange={setSelectedRota}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Rota" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={4} className="z-[200] max-h-[300px] overflow-y-auto">
                    <SelectItem value="all">Todas Rotas</SelectItem>
                    {rotasDisponiveis.map(rota => (
                      <SelectItem key={rota} value={rota.toString()}>Rota {rota}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {/* Estatísticas */}
            <div className="flex gap-2 pt-2 text-sm">
              <Badge variant="secondary">{totalFiltered} emprend.</Badge>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {totalGeoreferenced}
              </Badge>
              <Badge variant="outline" className="text-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                {totalFiltered - totalGeoreferenced}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedByRota).map(([rota, emps]) => (
                    <div key={rota}>
                      <div 
                        className="flex items-center gap-2 mb-2 sticky top-0 bg-card py-1"
                        style={{ borderLeft: `4px solid ${ROTA_COLORS[parseInt(rota)]}` }}
                      >
                        <span className="pl-2 font-medium text-sm">Rota {rota}</span>
                        <Badge variant="secondary" className="text-xs">{emps.length}</Badge>
                      </div>
                      
                      <div className="space-y-1 pl-2">
                        {emps.map(emp => (
                          <button
                            key={emp.id}
                            onClick={() => selectEmpreendimento(emp)}
                            className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                              selectedEmpreendimento?.id === emp.id
                                ? 'bg-primary/10 border border-primary'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{emp.nome}</div>
                                <div className="text-xs text-muted-foreground truncate">{emp.endereco}</div>
                              </div>
                              {emp.latitude && emp.longitude ? (
                                <MapPin className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <MapPin className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área do Mapa */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Token input se necessário */}
          {!mapboxToken && (
            <Card className="p-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>Token do Mapbox</Label>
                  <Input
                    placeholder="Cole seu token público do Mapbox aqui"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obtenha em <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a> → Tokens
                  </p>
                </div>
                <Button onClick={handleTokenSubmit}>Confirmar</Button>
              </div>
            </Card>
          )}

          {/* Mapa */}
          <Card className="flex-1 overflow-hidden">
            {mapboxToken ? (
              <div ref={mapContainer} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Configure o token do Mapbox para visualizar o mapa</p>
              </div>
            )}
          </Card>

          {/* Painel de Edição */}
          {selectedEmpreendimento && (
            <Card className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ROTA_COLORS[selectedEmpreendimento.rota] }}
                    />
                    <span className="text-sm font-medium">Rota {selectedEmpreendimento.rota}</span>
                  </div>
                  <h3 className="font-semibold truncate">{selectedEmpreendimento.nome}</h3>
                  <p className="text-sm text-muted-foreground truncate">{selectedEmpreendimento.endereco}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <div>
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        value={editLat}
                        onChange={(e) => setEditLat(e.target.value)}
                        placeholder="-3.7..."
                        className="w-28"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        value={editLng}
                        onChange={(e) => setEditLng(e.target.value)}
                        placeholder="-38.5..."
                        className="w-28"
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    className="mt-5"
                  >
                    {isGeocoding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !editLat || !editLng}
                    className="mt-5"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="ml-2">Salvar</span>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Clique no mapa para definir a localização ou use o botão de geocodificação automática.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GeorreferenciamentoTerceirizado;
