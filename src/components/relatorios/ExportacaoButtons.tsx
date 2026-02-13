import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, File } from 'lucide-react';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';
import { exportarPDF } from '@/lib/exportPDF';
import { exportarCSV } from '@/lib/exportCSV';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportacaoButtonsProps {
  tipoRelatorio: TipoRelatorio;
  dados: any[];
  filtros: FiltrosRelatorioType;
}

function exportarExcel(tipoRelatorio: TipoRelatorio, dados: any[]) {
  if (dados.length === 0) throw new Error('Não há dados para exportar');

  let headers: string[] = [];
  let rows: any[][] = [];

  switch (tipoRelatorio) {
    case 'condominios_competencia':
      headers = ['Condomínio', 'UF', 'Qtd Medidores', 'Data da Coleta'];
      rows = dados.map((item) => [
        item.condominio,
        item.uf || '',
        item.qtd_medidores,
        item.data_coleta ? format(new Date(item.data_coleta), 'dd/MM/yyyy', { locale: ptBR }) : '',
      ]);
      break;

    case 'rdo_servicos':
      headers = ['Data', 'Condomínio', 'Tipo Serviço', 'Técnico', 'Status', 'Descrição'];
      rows = dados.map((item) => [
        item.data ? format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR }) : '',
        item.condominio || '',
        item.tipo_servico,
        item.tecnico || '',
        item.status,
        item.descricao || '',
      ]);
      break;
  }

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, `relatorio_${tipoRelatorio}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
}

export default function ExportacaoButtons({ tipoRelatorio, dados, filtros }: ExportacaoButtonsProps) {
  const { toast } = useToast();

  const handleExportarPDF = () => {
    try {
      exportarPDF(tipoRelatorio, dados, filtros);
      toast({ title: 'PDF gerado com sucesso', description: 'O arquivo foi baixado.' });
    } catch (error) {
      toast({ title: 'Erro ao gerar PDF', description: 'Ocorreu um erro.', variant: 'destructive' });
    }
  };

  const handleExportarExcel = () => {
    try {
      exportarExcel(tipoRelatorio, dados);
      toast({ title: 'Excel gerado com sucesso', description: 'O arquivo foi baixado.' });
    } catch (error) {
      toast({ title: 'Erro ao gerar Excel', description: 'Ocorreu um erro.', variant: 'destructive' });
    }
  };

  const handleExportarCSV = () => {
    try {
      exportarCSV(tipoRelatorio, dados);
      toast({ title: 'CSV gerado com sucesso', description: 'O arquivo foi baixado.' });
    } catch (error) {
      toast({ title: 'Erro ao gerar CSV', description: 'Ocorreu um erro.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={handleExportarPDF} variant="outline">
        <FileText className="w-4 h-4 mr-2" />
        Exportar PDF
      </Button>
      <Button onClick={handleExportarExcel} variant="outline">
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Exportar Excel
      </Button>
      <Button onClick={handleExportarCSV} variant="outline">
        <File className="w-4 h-4 mr-2" />
        Exportar CSV
      </Button>
    </div>
  );
}
