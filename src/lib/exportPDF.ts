import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const relatorioTitulos: Record<TipoRelatorio, string> = {
  leituras_periodo: 'Leituras por Período',
  leituras_empreendimento: 'Leituras por Empreendimento',
  leituras_operador: 'Leituras por Operador',
  consumo_medio: 'Consumo Médio por Cliente',
  leituras_pendentes: 'Leituras Pendentes de Sincronização',
  leituras_observacoes: 'Leituras com Observações',
  servicos_agendados_executados: 'Serviços Agendados vs Executados',
  servicos_periodo: 'Serviços por Período',
  servicos_operador: 'Serviços por Operador',
  servicos_tipo: 'Serviços por Tipo',
  tempo_medio_execucao: 'Tempo Médio de Execução de Serviços',
  servicos_externos: 'Serviços Externos',
  dashboard_executivo: 'Dashboard Executivo',
  clientes_empreendimento: 'Clientes por Empreendimento',
  produtividade_operadores: 'Produtividade de Operadores',
  rastreamento_operadores: 'Rastreamento de Operadores',
  consumo_empreendimento: 'Consumo por Empreendimento',
};

export function exportarPDF(
  tipoRelatorio: TipoRelatorio,
  dados: any[],
  filtros: FiltrosRelatorioType
) {
  const doc = new jsPDF();
  const titulo = relatorioTitulos[tipoRelatorio] || 'Relatório';

  // Cabeçalho
  doc.setFontSize(18);
  doc.text(titulo, 14, 20);

  doc.setFontSize(10);
  doc.text(`Período: ${format(new Date(filtros.dataInicio), 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(filtros.dataFim), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 28);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 34);

  // Configurar colunas e linhas baseado no tipo de relatório
  let colunas: any[] = [];
  let linhas: any[] = [];

  switch (tipoRelatorio) {
    case 'leituras_periodo':
      colunas = ['Data', 'Cliente', 'Empreendimento', 'Operador', 'Leitura Ant.', 'Leitura Atual', 'Consumo'];
      linhas = dados.map((item) => [
        format(new Date(item.data_leitura), 'dd/MM/yyyy', { locale: ptBR }),
        item.cliente_nome,
        item.empreendimento,
        item.operador,
        item.leitura_anterior?.toFixed(2) || '-',
        item.leitura_atual?.toFixed(2),
        item.consumo?.toFixed(2) || '-',
      ]);
      break;

    case 'leituras_operador':
      colunas = ['Operador', 'Total Leituras', 'Dias Trabalhados', 'Média/Dia'];
      linhas = dados.map((item) => [
        item.nome,
        item.total_leituras,
        item.dias_trabalhados,
        item.leituras_por_dia,
      ]);
      break;

    case 'servicos_periodo':
    case 'servicos_agendados_executados':
      colunas = ['Data Agend.', 'Cliente/Local', 'Tipo', 'Status', 'Operador', 'Data Exec.'];
      linhas = dados.map((item) => [
        format(new Date(item.data_agendamento), 'dd/MM/yyyy', { locale: ptBR }),
        item.cliente_nome || item.nome_cliente,
        item.tipo_servico,
        item.status,
        item.operador_nome || '-',
        item.data_execucao ? format(new Date(item.data_execucao), 'dd/MM/yyyy', { locale: ptBR }) : '-',
      ]);
      break;

    case 'servicos_operador':
      colunas = ['Operador', 'Total Agendados', 'Concluídos', 'Em Andamento', 'Taxa Conclusão'];
      linhas = dados.map((item) => [
        item.operador_nome,
        item.total_agendados,
        item.concluidos,
        item.em_andamento,
        `${item.taxa_conclusao}%`,
      ]);
      break;

    default:
      colunas = ['Dados'];
      linhas = dados.map((item) => [JSON.stringify(item)]);
  }

  // Gerar tabela
  autoTable(doc, {
    head: [colunas],
    body: linhas,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Rodapé
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

  // Salvar
  doc.save(`${titulo.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
}
