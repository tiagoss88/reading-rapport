import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Map, Save, ExternalLink, Loader2, Trash2, RefreshCw, Route, ClipboardPaste } from 'lucide-react';
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

interface ParsedRoute {
  nome: string;
  rota: number;
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

  const [limpandoCache, setLimpandoCache] = useState(false);

  const handleLimparCache = async () => {
    setLimpandoCache(true);
    try {
      // 1. Desregistrar todos os Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      // 2. Limpar todos os caches do Cache Storage
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 3. Limpar chaves específicas do PWA (preservando sessão Supabase)
      const chavesPwa = [
        'pwa-banner-dismissed',
        'coletor_synced_empreendimentos',
        'coletor_sync_timestamp',
      ];
      chavesPwa.forEach((k) => localStorage.removeItem(k));

      toast.success('Cache limpo! Recarregando o app...');

      // 4. Forçar reload completo
      setTimeout(() => {
        window.location.href = window.location.pathname + '?_t=' + Date.now();
      }, 800);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache. Tente novamente.');
      setLimpandoCache(false);
    }
  };

  // ---- Atualizar Rotas ----
  const [rotaUf, setRotaUf] = useState('BA');
  const [rotaTexto, setRotaTexto] = useState('');
  const [rotasParsed, setRotasParsed] = useState<ParsedRoute[]>([]);
  const [rotaLog, setRotaLog] = useState<string[]>([]);
  const [rotaRunning, setRotaRunning] = useState(false);

  const parseRotas = () => {
    const lines = rotaTexto.trim().split('\n').filter(l => l.trim());
    const parsed: ParsedRoute[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip header lines
      if (/^condominio/i.test(trimmed) || /^nome/i.test(trimmed)) continue;

      // Try tab separator first, then last number in line
      const tabParts = trimmed.split('\t');
      if (tabParts.length >= 2) {
        const rota = parseInt(tabParts[tabParts.length - 1].trim());
        const nome = tabParts.slice(0, -1).join('\t').trim();
        if (nome && !isNaN(rota) && rota > 0) {
          parsed.push({ nome, rota });
          continue;
        }
      }

      // Fallback: last token is the number
      const match = trimmed.match(/^(.+?)\s+(\d+)\s*$/);
      if (match) {
        parsed.push({ nome: match[1].trim(), rota: parseInt(match[2]) });
      }
    }

    setRotasParsed(parsed);
    if (parsed.length === 0) {
      toast.error('Nenhuma linha válida encontrada. Formato: CONDOMINIO [tab ou espaços] ROTA');
    } else {
      toast.success(`${parsed.length} linhas identificadas`);
    }
  };

  const executarRotas = async () => {
    if (rotasParsed.length === 0) return;
    setRotaRunning(true);
    setRotaLog([]);
    const log: string[] = [];

    log.push(`Buscando empreendimentos de UF = ${rotaUf}...`);
    setRotaLog([...log]);

    const { data: empreendimentos, error } = await supabase
      .from('empreendimentos_terceirizados')
      .select('id, nome, rota')
      .eq('uf', rotaUf);

    if (error) {
      log.push(`ERRO: ${error.message}`);
      setRotaLog([...log]);
      setRotaRunning(false);
      return;
    }

    log.push(`Encontrados ${empreendimentos.length} empreendimentos no banco.`);
    setRotaLog([...log]);

    const lookup: Map<string, { id: string; nome: string; rota: number }> = new Map();
    for (const emp of empreendimentos) {
      lookup.set(emp.nome.trim().toUpperCase(), emp);
    }

    let updated = 0, skipped = 0, notFound = 0;
    const notFoundList: string[] = [];

    for (const item of rotasParsed) {
      const key = item.nome.trim().toUpperCase();
      const emp = lookup.get(key);

      if (!emp) {
        log.push(`❌ Não encontrado: "${item.nome}"`);
        notFoundList.push(item.nome);
        notFound++;
        continue;
      }

      if (emp.rota === item.rota) {
        skipped++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('empreendimentos_terceirizados')
        .update({ rota: item.rota })
        .eq('id', emp.id);

      if (updateError) {
        log.push(`⚠️ Erro ao atualizar "${emp.nome}": ${updateError.message}`);
      } else {
        log.push(`✅ "${emp.nome}": rota ${emp.rota} → ${item.rota}`);
        updated++;
      }
    }

    log.push('');
    log.push('=== RESUMO ===');
    log.push(`Atualizados: ${updated}`);
    log.push(`Já corretos: ${skipped}`);
    log.push(`Não encontrados: ${notFound}`);
    if (notFoundList.length > 0) {
      log.push(`Nomes: ${notFoundList.join(', ')}`);
    }
    log.push('Concluído!');
    setRotaLog([...log]);
    setRotaRunning(false);
    toast.success(`Atualização concluída: ${updated} alterados, ${skipped} já corretos, ${notFound} não encontrados`);
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

        {/* Card Cache do Aplicativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Cache do Aplicativo
            </CardTitle>
            <CardDescription>
              Limpa todos os caches locais (Service Worker e Cache Storage) e recarrega o app com a versão mais recente. Útil quando mudanças não aparecem após uma atualização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={limpandoCache}>
                  {limpandoCache ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Limpar cache e recarregar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar cache do aplicativo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover o Service Worker e todos os caches locais, depois recarregar a página automaticamente. Sua sessão de login será preservada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLimparCache}>
                    Sim, limpar e recarregar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ConfiguracoesSistema;
