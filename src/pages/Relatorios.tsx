import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Wrench } from 'lucide-react';
import RelatorioSelector from '@/components/relatorios/RelatorioSelector';
import FiltrosRelatorio from '@/components/relatorios/FiltrosRelatorio';
import TabelaRelatorio from '@/components/relatorios/TabelaRelatorio';
import ExportacaoButtons from '@/components/relatorios/ExportacaoButtons';

export type TipoRelatorio = 'condominios_competencia' | 'rdo_servicos';

export interface FiltrosRelatorioType {
  competencia?: string; // formato YYYY-MM
  dataInicio: string;
  dataFim: string;
  periodicidade?: 'diario' | 'semanal' | 'mensal';
  operadorId?: string;
  tipoServico?: string;
  statusServico?: string;
}

export default function Relatorios() {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio | null>(null);
  const now = new Date();
  const [filtros, setFiltros] = useState<FiltrosRelatorioType>({
    competencia: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    dataInicio: new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    periodicidade: 'diario',
  });
  const [dadosRelatorio, setDadosRelatorio] = useState<any[]>([]);

  const categorias = [
    {
      id: 'leituras',
      titulo: 'Leituras',
      descricao: 'Condomínios coletados por competência',
      icon: FileText,
      color: 'text-blue-500'
    },
    {
      id: 'servicos',
      titulo: 'Serviços',
      descricao: 'RDO - Relatório Diário de Obra',
      icon: Wrench,
      color: 'text-green-500'
    },
  ];

  return (
    <Layout title="Relatórios">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📊 Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Extraia informações gerenciais e operacionais do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <RelatorioSelector
              tipoSelecionado={tipoSelecionado}
              onTipoChange={(tipo) => {
                setTipoSelecionado(tipo);
                setDadosRelatorio([]);
              }}
            />
          </CardContent>
        </Card>

        {tipoSelecionado && (
          <FiltrosRelatorio
            tipoRelatorio={tipoSelecionado}
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onGerarRelatorio={setDadosRelatorio}
          />
        )}

        {dadosRelatorio.length > 0 && tipoSelecionado && (
          <>
            <TabelaRelatorio
              tipoRelatorio={tipoSelecionado}
              dados={dadosRelatorio}
            />
            <ExportacaoButtons
              tipoRelatorio={tipoSelecionado}
              dados={dadosRelatorio}
              filtros={filtros}
            />
          </>
        )}

        {dadosRelatorio.length === 0 && tipoSelecionado && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum dado encontrado. Ajuste os filtros e tente novamente.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
