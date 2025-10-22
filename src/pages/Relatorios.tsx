import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Wrench, BarChart3, DollarSign } from 'lucide-react';
import RelatorioSelector from '@/components/relatorios/RelatorioSelector';
import FiltrosRelatorio from '@/components/relatorios/FiltrosRelatorio';
import TabelaRelatorio from '@/components/relatorios/TabelaRelatorio';
import ExportacaoButtons from '@/components/relatorios/ExportacaoButtons';

export type TipoRelatorio = 
  | 'leituras_periodo'
  | 'leituras_empreendimento'
  | 'leituras_operador'
  | 'consumo_medio'
  | 'leituras_pendentes'
  | 'leituras_observacoes'
  | 'servicos_agendados_executados'
  | 'servicos_periodo'
  | 'servicos_operador'
  | 'servicos_tipo'
  | 'tempo_medio_execucao'
  | 'servicos_externos'
  | 'dashboard_executivo'
  | 'clientes_empreendimento'
  | 'produtividade_operadores'
  | 'rastreamento_operadores'
  | 'consumo_empreendimento';

export interface FiltrosRelatorioType {
  dataInicio: string;
  dataFim: string;
  empreendimentoId?: string;
  operadorId?: string;
  status?: string;
  tipoServico?: string;
}

export default function Relatorios() {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio | null>(null);
  const [filtros, setFiltros] = useState<FiltrosRelatorioType>({
    dataInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
  });
  const [dadosRelatorio, setDadosRelatorio] = useState<any[]>([]);

  const categorias = [
    {
      id: 'leituras',
      titulo: 'Leituras',
      descricao: '6 tipos de relatórios',
      icon: FileText,
      color: 'text-blue-500'
    },
    {
      id: 'servicos',
      titulo: 'Serviços',
      descricao: '6 tipos de relatórios',
      icon: Wrench,
      color: 'text-green-500'
    },
    {
      id: 'gerencial',
      titulo: 'Gerencial',
      descricao: '5 tipos de relatórios',
      icon: BarChart3,
      color: 'text-purple-500'
    },
    {
      id: 'financeiro',
      titulo: 'Financeiro',
      descricao: 'Em breve',
      icon: DollarSign,
      color: 'text-amber-500'
    }
  ];

  return (
    <Layout title="Relatórios">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">📊 Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Extraia informações gerenciais e operacionais do sistema
          </p>
        </div>

        {/* Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categorias.map((categoria) => (
            <Card key={categoria.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <categoria.icon className={`w-5 h-5 ${categoria.color}`} />
                  {categoria.titulo}
                </CardTitle>
                <CardDescription>{categoria.descricao}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Seletor de Relatório */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <RelatorioSelector 
              tipoSelecionado={tipoSelecionado}
              onTipoChange={setTipoSelecionado}
            />
          </CardContent>
        </Card>

        {/* Filtros */}
        {tipoSelecionado && (
          <FiltrosRelatorio
            tipoRelatorio={tipoSelecionado}
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onGerarRelatorio={setDadosRelatorio}
          />
        )}

        {/* Tabela de Resultados */}
        {dadosRelatorio.length > 0 && (
          <>
            <TabelaRelatorio
              tipoRelatorio={tipoSelecionado!}
              dados={dadosRelatorio}
            />
            
            <ExportacaoButtons
              tipoRelatorio={tipoSelecionado!}
              dados={dadosRelatorio}
              filtros={filtros}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
