import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Save, Search } from 'lucide-react';
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

export default function GeoreferenciarClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
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

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      setMapboxTokenMissing(true);
    }
  }, []);

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, identificacao_unidade, nome, endereco, latitude, longitude, empreendimento_id')
      .eq('status', 'ativo')
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

    // Remover todos os marcadores
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

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

    // Ajustar bounds se houver clientes georreferenciados
    const georeferencedClientes = clientes.filter(c => c.latitude && c.longitude);
    if (georeferencedClientes.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      georeferencedClientes.forEach(c => {
        bounds.extend([c.longitude!, c.latitude!]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [clientes]);

  useEffect(() => {
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
