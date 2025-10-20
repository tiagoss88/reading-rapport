import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Save, Search, Building2 } from 'lucide-react';
import { toast } from 'sonner';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface Cliente {
  id: string;
  identificacao_unidade: string;
  nome: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  empreendimento_id: string;
}

interface Empreendimento {
  id: string;
  nome: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
}

export default function GeoreferenciarClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapboxTokenMissing, setMapboxTokenMissing] = useState(false);
  const [editData, setEditData] = useState({
    endereco: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    latitude: '',
    longitude: ''
  });
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const tempMarker = useRef<mapboxgl.Marker | null>(null);
  const empreendimentoMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      setMapboxTokenMissing(true);
    }
  }, []);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!mapboxgl.accessToken) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&country=BR&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
    }
    
    return null;
  };

  const fetchEmpreendimentos = async () => {
    const { data, error } = await supabase.rpc('get_public_empreendimentos');

    if (error) {
      console.error('Erro ao buscar empreendimentos:', error);
      return;
    }

    if (data) {
      // Geocodificar empreendimentos sem coordenadas
      const empsWithCoords = await Promise.all(
        data.map(async (emp: Empreendimento) => {
          if (!emp.latitude || !emp.longitude) {
            const coords = await geocodeAddress(emp.endereco);
            if (coords) {
              // Atualizar no banco
              await supabase
                .from('empreendimentos')
                .update({
                  latitude: coords.lat,
                  longitude: coords.lng
                })
                .eq('id', emp.id);
              
              return { ...emp, latitude: coords.lat, longitude: coords.lng };
            }
          }
          return emp;
        })
      );
      
      setEmpreendimentos(empsWithCoords.filter(e => e.latitude && e.longitude));
    }
  };

  const fetchClientes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: empUsers, error: empError } = await supabase
      .from('empreendimento_users')
      .select('empreendimento_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (empError) {
      console.error('Erro ao buscar empreendimento:', empError);
      return;
    }

    if (!empUsers) {
      toast.error('Nenhum empreendimento associado ao usuário');
      return;
    }

    // Buscar clientes do empreendimento
    const { data, error } = await supabase
      .from('clientes')
      .select('id, identificacao_unidade, nome, endereco, latitude, longitude, empreendimento_id')
      .eq('status', 'ativo')
      .eq('empreendimento_id', empUsers.empreendimento_id)
      .order('identificacao_unidade');

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return;
    }

    if (data) {
      setClientes(data as Cliente[]);
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

      // Permitir adicionar marcador clicando no mapa
      map.current.on('click', (e) => {
        if (selectedCliente) {
          const { lng, lat } = e.lngLat;
          
          // Remover marcador temporário anterior
          if (tempMarker.current) {
            tempMarker.current.remove();
          }

          // Adicionar novo marcador temporário
          const el = document.createElement('div');
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#3b82f6';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

          tempMarker.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);

          setEditData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }));

          toast.info('Localização selecionada no mapa');
        }
      });
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      setMapboxTokenMissing(true);
    }

    return () => {
      map.current?.remove();
    };
  }, [selectedCliente]);

  useEffect(() => {
    if (!map.current) return;

    // Remover todos os marcadores de clientes
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Remover marcadores dos empreendimentos
    Object.values(empreendimentoMarkers.current).forEach(marker => marker.remove());
    empreendimentoMarkers.current = {};

    // Adicionar marcadores dos empreendimentos
    empreendimentos.forEach((emp) => {
      if (emp.latitude && emp.longitude) {
        const el = document.createElement('div');
        el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.cursor = 'default';
        el.style.color = '#ef4444';
        el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([emp.longitude, emp.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 15 })
              .setHTML(`<div style="padding: 4px;"><strong>${emp.nome}</strong><br/>${emp.endereco}</div>`)
          )
          .addTo(map.current!);

        empreendimentoMarkers.current[emp.id] = marker;
      }
    });

    // Adicionar marcadores para clientes georreferenciados
    clientes
      .filter(c => c.latitude && c.longitude)
      .forEach((cliente) => {
        const el = document.createElement('div');
        el.style.width = '28px';
        el.style.height = '28px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.backgroundColor = '#10b981';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([cliente.longitude!, cliente.latitude!])
          .addTo(map.current!);

        marker.getElement().addEventListener('click', () => {
          selectCliente(cliente);
        });

        markers.current[cliente.id] = marker;
      });

    // Ajustar bounds para incluir empreendimentos e clientes
    const georeferencedClientes = clientes.filter(c => c.latitude && c.longitude);
    const georeferencedEmps = empreendimentos.filter(e => e.latitude && e.longitude);
    
    if (georeferencedClientes.length > 0 || georeferencedEmps.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      georeferencedEmps.forEach(e => {
        bounds.extend([e.longitude!, e.latitude!]);
      });
      
      georeferencedClientes.forEach(c => {
        bounds.extend([c.longitude!, c.latitude!]);
      });
      
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [clientes, empreendimentos]);

  useEffect(() => {
    fetchEmpreendimentos();
    fetchClientes();
  }, []);

  const selectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setEditData({
      endereco: cliente.endereco || '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      latitude: cliente.latitude?.toString() || '',
      longitude: cliente.longitude?.toString() || ''
    });

    // Remover marcador temporário ao selecionar outro cliente
    if (tempMarker.current) {
      tempMarker.current.remove();
      tempMarker.current = null;
    }

    if (cliente.latitude && cliente.longitude && map.current) {
      map.current.flyTo({
        center: [cliente.longitude, cliente.latitude],
        zoom: 16
      });
    }
  };

  const handleSave = async () => {
    if (!selectedCliente) return;

    const { error } = await supabase
      .from('clientes')
      .update({
        endereco: editData.endereco || null,
        complemento: editData.complemento || null,
        bairro: editData.bairro || null,
        cidade: editData.cidade || null,
        estado: editData.estado || null,
        cep: editData.cep || null,
        latitude: editData.latitude ? parseFloat(editData.latitude) : null,
        longitude: editData.longitude ? parseFloat(editData.longitude) : null
      })
      .eq('id', selectedCliente.id);

    if (error) {
      toast.error('Erro ao salvar georreferenciamento');
      console.error(error);
      return;
    }

    toast.success('Georreferenciamento salvo com sucesso!');
    
    // Remover marcador temporário
    if (tempMarker.current) {
      tempMarker.current.remove();
      tempMarker.current = null;
    }

    await fetchClientes();
    setSelectedCliente(null);
  };

  const filteredClientes = clientes.filter(c =>
    c.identificacao_unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clientesGeorreferenciados = clientes.filter(c => c.latitude && c.longitude).length;

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      <div className="w-80 overflow-auto space-y-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Clientes ({clientes.length})
            </h2>
            <Badge variant="secondary">
              {clientesGeorreferenciados} georreferenciados
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {filteredClientes.map((cliente) => (
          <Card
            key={cliente.id}
            className={`cursor-pointer transition-all ${
              selectedCliente?.id === cliente.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => selectCliente(cliente)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{cliente.identificacao_unidade}</h3>
                  {cliente.nome && (
                    <p className="text-xs text-muted-foreground">{cliente.nome}</p>
                  )}
                </div>
                {cliente.latitude && cliente.longitude ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Geo
                  </Badge>
                ) : (
                  <Badge variant="outline">Sem localização</Badge>
                )}
              </div>
              {cliente.endereco && (
                <p className="text-xs text-muted-foreground mt-1">{cliente.endereco}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredClientes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum cliente encontrado</p>
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
                Configure um token público do Mapbox para usar esta funcionalidade.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
            
            {selectedCliente && (
              <Card className="absolute top-4 left-4 z-10 w-96 max-h-[calc(100%-2rem)] overflow-auto">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">{selectedCliente.identificacao_unidade}</h3>
                    {selectedCliente.nome && (
                      <p className="text-sm text-muted-foreground">{selectedCliente.nome}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={editData.endereco}
                        onChange={(e) => setEditData(prev => ({ ...prev, endereco: e.target.value }))}
                        placeholder="Rua, número"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          id="complemento"
                          value={editData.complemento}
                          onChange={(e) => setEditData(prev => ({ ...prev, complemento: e.target.value }))}
                          placeholder="Apto, bloco"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={editData.bairro}
                          onChange={(e) => setEditData(prev => ({ ...prev, bairro: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={editData.cidade}
                          onChange={(e) => setEditData(prev => ({ ...prev, cidade: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="estado">Estado (UF)</Label>
                        <Input
                          id="estado"
                          value={editData.estado}
                          onChange={(e) => setEditData(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={editData.cep}
                        onChange={(e) => setEditData(prev => ({ ...prev, cep: e.target.value }))}
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.000001"
                          value={editData.latitude}
                          onChange={(e) => setEditData(prev => ({ ...prev, latitude: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.000001"
                          value={editData.longitude}
                          onChange={(e) => setEditData(prev => ({ ...prev, longitude: e.target.value }))}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Clique no mapa para definir a localização
                    </p>

                    <Button onClick={handleSave} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Georreferenciamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
