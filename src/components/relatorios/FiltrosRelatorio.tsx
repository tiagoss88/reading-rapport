import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';
import { useRelatorioLeituras } from '@/hooks/useRelatorioLeituras';
import { useRelatorioServicos } from '@/hooks/useRelatorioServicos';
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

  const { data: empreendimentos } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      return data;
    },
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

  const handleGerarRelatorio = async () => {
    setIsLoading(true);
    try {
      let dados: any[] = [];

      // Relatórios de Leituras
      if (tipoRelatorio.startsWith('leituras_') || tipoRelatorio === 'consumo_medio') {
        dados = await gerarRelatorioLeituras(tipoRelatorio, filtros);
      }
      // Relatórios de Serviços
      else if (tipoRelatorio.startsWith('servicos_') || tipoRelatorio === 'tempo_medio_execucao') {
        dados = await gerarRelatorioServicos(tipoRelatorio, filtros);
      }
      // Relatórios Gerenciais (implementar futuramente)
      else {
        dados = [];
      }

      if (dados.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há registros para o período e filtros selecionados.",
        });
      } else {
        toast({
          title: "Relatório gerado com sucesso",
          description: `${dados.length} registro(s) encontrado(s)`,
        });
      }

      onGerarRelatorio(dados);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      onGerarRelatorio([]);
    } finally {
      setIsLoading(false);
    }
  };

  const mostrarFiltroEmpreendimento = !tipoRelatorio.includes('empreendimento');
  const mostrarFiltroOperador = !tipoRelatorio.includes('operador');
  const mostrarFiltroStatus = tipoRelatorio.includes('servicos');
  const mostrarFiltroTipo = tipoRelatorio === 'servicos_tipo';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data Início */}
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => onFiltrosChange({ ...filtros, dataInicio: e.target.value })}
            />
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => onFiltrosChange({ ...filtros, dataFim: e.target.value })}
            />
          </div>

          {/* Empreendimento */}
          {mostrarFiltroEmpreendimento && (
            <div className="space-y-2">
              <Label htmlFor="empreendimento">Empreendimento</Label>
              <Select
                value={filtros.empreendimentoId || 'todos'}
                onValueChange={(value) =>
                  onFiltrosChange({
                    ...filtros,
                    empreendimentoId: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {empreendimentos?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Operador */}
          {mostrarFiltroOperador && (
            <div className="space-y-2">
              <Label htmlFor="operador">Operador</Label>
              <Select
                value={filtros.operadorId || 'todos'}
                onValueChange={(value) =>
                  onFiltrosChange({
                    ...filtros,
                    operadorId: value === 'todos' ? undefined : value,
                  })
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

          {/* Status (para serviços) */}
          {mostrarFiltroStatus && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filtros.status || 'todos'}
                onValueChange={(value) =>
                  onFiltrosChange({
                    ...filtros,
                    status: value === 'todos' ? undefined : value,
                  })
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
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo de Serviço */}
          {mostrarFiltroTipo && (
            <div className="space-y-2">
              <Label htmlFor="tipoServico">Tipo de Serviço</Label>
              <Select
                value={filtros.tipoServico || 'todos'}
                onValueChange={(value) =>
                  onFiltrosChange({
                    ...filtros,
                    tipoServico: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="reparo">Reparo</SelectItem>
                  <SelectItem value="vistoria">Vistoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
