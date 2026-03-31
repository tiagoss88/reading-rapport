import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const relatorioTitulos: Record<TipoRelatorio, string> = {
  condominios_competencia: 'Condomínios Coletados por Competência',
  rdo_servicos: 'RDO - Relatório Diário de Obra',
  cadastro_condominios_uf: 'Cadastro de Condomínios por UF',
  coletas_sem_pendencia: 'Coletas Sem Pendência',
};

export function exportarPDF(
  tipoRelatorio: TipoRelatorio,
  dados: any[],
  filtros: FiltrosRelatorioType
) {
  const doc = new jsPDF();
  const titulo = relatorioTitulos[tipoRelatorio];

  doc.setFontSize(18);
  doc.text(titulo, 14, 20);

  doc.setFontSize(10);
  if (tipoRelatorio === 'cadastro_condominios_uf') {
    if (filtros.ufFiltro) {
      doc.text(`UF: ${filtros.ufFiltro}`, 14, 28);
    } else {
      doc.text('Todas as UFs', 14, 28);
    }
  } else if (tipoRelatorio === 'condominios_competencia' && filtros.competencia) {
    const [ano, mes] = filtros.competencia.split('-');
    doc.text(`Competência: ${mes}/${ano}`, 14, 28);
  } else {
    doc.text(`Período: ${format(new Date(filtros.dataInicio), 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(filtros.dataFim), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 28);
  }
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 34);

  let colunas: string[] = [];
  let linhas: any[][] = [];

  switch (tipoRelatorio) {
    case 'condominios_competencia':
      colunas = ['Condomínio', 'UF', 'Qtd Medidores', 'Data da Coleta'];
      linhas = dados.map((item) => [
        item.condominio,
        item.uf || '-',
        item.qtd_medidores,
        item.data_coleta ? format(new Date(item.data_coleta), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      ]);
      break;

    case 'cadastro_condominios_uf':
      colunas = ['Condomínio', 'UF', 'Rota', 'Qtd Medidores'];
      linhas = dados.map((item) => [
        item.condominio,
        item.uf || '',
        item.rota != null ? item.rota : '--',
        item.qtd_medidores,
      ]);
      break;

    case 'rdo_servicos':
      colunas = ['Data', 'Condomínio', 'Tipo Serviço', 'Técnico', 'Status'];
      linhas = dados.map((item) => [
        item.data ? format(new Date(item.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        item.condominio || '-',
        item.tipo_servico?.toUpperCase(),
        item.tecnico || '-',
        item.status,
      ]);
      break;

    case 'coletas_sem_pendencia':
      colunas = ['Condomínio', 'UF', 'Técnico', 'Data Coleta', 'Observação'];
      linhas = dados.map((item) => [
        item.condominio || '-',
        item.uf || '-',
        item.tecnico || '-',
        item.data_coleta ? format(new Date(item.data_coleta + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        item.observacao || '-',
      ]);
      break;
  }

  autoTable(doc, {
    head: [colunas],
    body: linhas,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${totalPages}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${titulo.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
}
