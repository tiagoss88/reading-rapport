import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import RelatorioSelector from '@/components/relatorios/RelatorioSelector';
import FiltrosRelatorio from '@/components/relatorios/FiltrosRelatorio';
import TabelaRelatorio from '@/components/relatorios/TabelaRelatorio';
import ExportacaoButtons from '@/components/relatorios/ExportacaoButtons';
import { FiltrosRelatorioType, TipoRelatorio } from '@/pages/Relatorios';

export default function RelatoriosServicos() {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio | null>(null);
  const now = new Date();
  const [filtros, setFiltros] = useState<FiltrosRelatorioType>({
    competencia: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    dataInicio: new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    periodicidade: 'diario',
  });
  const [dadosRelatorio, setDadosRelatorio] = useState<any[]>([]);

  return (
    <Layout title="Relatórios de Serviços">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📊 Relatórios de Serviços</h1>
          <p className="text-muted-foreground mt-1">
            Relatórios relacionados a serviços e RDO
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <RelatorioSelector
              tipoSelecionado={tipoSelecionado}
              onTipoChange={(tipo) => {
                setTipoSelecionado(tipo);
                setDadosRelatorio([]);
              }}
              categoria="Serviços"
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
            <TabelaRelatorio tipoRelatorio={tipoSelecionado} dados={dadosRelatorio} />
            <ExportacaoButtons tipoRelatorio={tipoSelecionado} dados={dadosRelatorio} filtros={filtros} />
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
