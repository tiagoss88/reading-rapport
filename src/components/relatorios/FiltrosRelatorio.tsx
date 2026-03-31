import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';
import { useRelatorioLeituras } from '@/hooks/useRelatorioLeituras';
import { useRelatorioServicos } from '@/hooks/useRelatorioServicos';
import { useRelatorioCadastroCondominios } from '@/hooks/useRelatorioCadastroCondominios';
import { useRelatorioColetasSemPendencia } from '@/hooks/useRelatorioColetasSemPendencia';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FiltrosRelatorioProps {
  tipoRelatorio: TipoRelatorio;
  filtros: FiltrosRelatorioType;
  onFiltrosChange: (filtros: FiltrosRelatorioType) => void;
  onGerarRelatorio: (dados: any[]) => void;
}

export default function FiltrosRelatorio({
  tipoRelatorio,
  filtros,
  onFiltrosChange,
  onGerarRelatorio,
}: FiltrosRelatorioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { gerarRelatorioLeituras } = useRelatorioLeituras();
  const { gerarRelatorioServicos } = useRelatorioServicos();
  const { gerarRelatorioCadastroCondominios } = useRelatorioCadastroCondominios();
  const { gerarRelatorioColetasSemPendencia } = useRelatorioColetasSemPendencia();

  const { data: ufsDisponiveis } = useQuery({
    queryKey: ['ufs_disponiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('uf')
        .order('uf');
      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.uf).filter(Boolean))];
      return unique as string[];
    },
    enabled: tipoRelatorio === 'cadastro_condominios_uf' || tipoRelatorio === 'coletas_sem_pendencia',
  });

  const { data: operadores } = useQuery({
    queryKey: ['operadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: tiposServico } = useQuery({
    queryKey: ['tipos_servico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_servico')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: tipoRelatorio === 'rdo_servicos',
  });

  const handleGerarRelatorio = async () => {
    setIsLoading(true);
    try {
      let dados: any[] = [];

      if (tipoRelatorio === 'condominios_competencia') {
        dados = await gerarRelatorioLeituras(filtros);
      } else if (tipoRelatorio === 'rdo_servicos') {
        dados = await gerarRelatorioServicos(filtros);
      } else if (tipoRelatorio === 'cadastro_condominios_uf') {
        dados = await gerarRelatorioCadastroCondominios(filtros);
      } else if (tipoRelatorio === 'coletas_sem_pendencia') {
        dados = await gerarRelatorioColetasSemPendencia(filtros);
      }

      if (dados.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não há registros para os filtros selecionados.',
        });
      } else {
        toast({
          title: 'Relatório gerado com sucesso',
          description: `${dados.length} registro(s) encontrado(s)`,
        });
      }

      onGerarRelatorio(dados);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      onGerarRelatorio([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(tipoRelatorio === 'condominios_competencia' || tipoRelatorio === 'coletas_sem_pendencia') && (
            <div className="space-y-2">
              <Label htmlFor="competencia">Competência (Mês/Ano)</Label>
              <Input
                id="competencia"
                type="month"
                value={filtros.competencia || ''}
                onChange={(e) => onFiltrosChange({ ...filtros, competencia: e.target.value })}
              />
            </div>
          )}

          {(tipoRelatorio === 'cadastro_condominios_uf' || tipoRelatorio === 'coletas_sem_pendencia') && (
            <div className="space-y-2">
              <Label htmlFor="ufFiltro">UF</Label>
              <Select
                value={filtros.ufFiltro || 'todos'}
                onValueChange={(value) =>
                  onFiltrosChange({ ...filtros, ufFiltro: value === 'todos' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {ufsDisponiveis?.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipoRelatorio === 'coletas_sem_pendencia' && (
            <div className="space-y-2">
              <Label htmlFor="operador">Técnico</Label>
              <Select
                value={filtros.operadorId || 'todos'}
                onValueChange={(value) =>
                  onFiltrosChange({ ...filtros, operadorId: value === 'todos' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {operadores?.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipoRelatorio === 'rdo_servicos' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="periodicidade">Periodicidade</Label>
                <Select
                  value={filtros.periodicidade || 'diario'}
                  onValueChange={(value) =>
                    onFiltrosChange({ ...filtros, periodicidade: value as 'diario' | 'semanal' | 'mensal' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => onFiltrosChange({ ...filtros, dataInicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => onFiltrosChange({ ...filtros, dataFim: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoServico">Tipo de Serviço</Label>
                <Select
                  value={filtros.tipoServico || 'todos'}
                  onValueChange={(value) =>
                    onFiltrosChange({ ...filtros, tipoServico: value === 'todos' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {tiposServico?.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.nome}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operador">Técnico</Label>
                <Select
                  value={filtros.operadorId || 'todos'}
                  onValueChange={(value) =>
                    onFiltrosChange({ ...filtros, operadorId: value === 'todos' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {operadores?.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusServico">Status</Label>
                <Select
                  value={filtros.statusServico || 'todos'}
                  onValueChange={(value) =>
                    onFiltrosChange({ ...filtros, statusServico: value === 'todos' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="executado">Executado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <Button
            onClick={handleGerarRelatorio}
            className="w-full md:w-auto"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
