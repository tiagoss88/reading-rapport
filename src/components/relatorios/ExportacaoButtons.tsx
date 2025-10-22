import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, File } from 'lucide-react';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';
import { exportarPDF } from '@/lib/exportPDF';
import { exportarCSV } from '@/lib/exportCSV';
import { useToast } from '@/hooks/use-toast';

interface ExportacaoButtonsProps {
  tipoRelatorio: TipoRelatorio;
  dados: any[];
  filtros: FiltrosRelatorioType;
}

export default function ExportacaoButtons({ tipoRelatorio, dados, filtros }: ExportacaoButtonsProps) {
  const { toast } = useToast();

  const handleExportarPDF = () => {
    try {
      exportarPDF(tipoRelatorio, dados, filtros);
      toast({
        title: 'PDF gerado com sucesso',
        description: 'O arquivo foi baixado para seu computador.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Ocorreu um erro ao gerar o arquivo PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleExportarCSV = () => {
    try {
      exportarCSV(tipoRelatorio, dados);
      toast({
        title: 'CSV gerado com sucesso',
        description: 'O arquivo foi baixado para seu computador.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar CSV',
        description: 'Ocorreu um erro ao gerar o arquivo CSV.',
        variant: 'destructive',
      });
    }
  };

  const handleExportarExcel = () => {
    // Usar CSV como fallback para Excel
    handleExportarCSV();
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
