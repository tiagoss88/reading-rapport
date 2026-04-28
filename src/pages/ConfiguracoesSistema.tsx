import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Map, Save, ExternalLink, Loader2, Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Configuracao {
  id: string;
  chave: string;
  valor: string | null;
  descricao: string | null;
  tipo: string | null;
}

const ConfiguracoesSistema = () => {
  const queryClient = useQueryClient();
  const [mapboxToken, setMapboxToken] = useState('');

  const { data: configuracoes, isLoading } = useQuery({
    queryKey: ['configuracoes-sistema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*');
      
      if (error) throw error;
      return data as Configuracao[];
    }
  });

  // Sincronizar estado local com dados do banco
  React.useEffect(() => {
    if (configuracoes) {
      const mapboxConfig = configuracoes.find(c => c.chave === 'mapbox_token');
      if (mapboxConfig?.valor) {
        setMapboxToken(mapboxConfig.valor);
      }
    }
  }, [configuracoes]);

  const updateMutation = useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({ valor })
        .eq('chave', chave);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-sistema'] });
      queryClient.invalidateQueries({ queryKey: ['configuracao-mapbox'] });
      toast.success('Configuração salva com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    }
  });

  const handleSaveMapbox = () => {
    if (!mapboxToken.trim()) {
      toast.error('Informe o token do Mapbox');
      return;
    }
    
    if (!mapboxToken.startsWith('pk.')) {
      toast.error('Token inválido. O token público do Mapbox deve começar com "pk."');
      return;
    }

    updateMutation.mutate({ chave: 'mapbox_token', valor: mapboxToken.trim() });
  };

  if (isLoading) {
    return (
      <Layout title="Configurações do Sistema">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Configurações do Sistema">
      <div className="space-y-6">
        {/* Card Mapbox */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Integração Mapbox
            </CardTitle>
            <CardDescription>
              Configure o token do Mapbox para habilitar os mapas de georreferenciamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Token Público do Mapbox</Label>
              <div className="flex gap-2">
                <Input
                  id="mapbox-token"
                  type="text"
                  placeholder="pk.eyJ1Ijoi..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={handleSaveMapbox}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="ml-2">Salvar</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Obtenha seu token em{' '}
                <a 
                  href="https://account.mapbox.com/access-tokens/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  mapbox.com → Tokens
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {mapboxToken && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Status:</strong>{' '}
                  <span className="text-green-600">Token configurado</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ConfiguracoesSistema;
