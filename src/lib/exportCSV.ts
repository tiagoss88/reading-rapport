import { TipoRelatorio } from '@/pages/Relatorios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function exportarCSV(tipoRelatorio: TipoRelatorio, dados: any[]) {
  if (dados.length === 0) {
    throw new Error('Não há dados para exportar');
  }

  let colunas: string[] = [];
  let linhas: string[][] = [];

  switch (tipoRelatorio) {
    case 'leituras_periodo':
      colunas = ['Data', 'Cliente', 'Empreendimento', 'Operador', 'Leitura Anterior', 'Leitura Atual', 'Consumo'];
      linhas = dados.map((item) => [
        format(new Date(item.data_leitura), 'dd/MM/yyyy', { locale: ptBR }),
        item.cliente_nome,
        item.empreendimento,
        item.operador,
        item.leitura_anterior?.toFixed(2) || '',
        item.leitura_atual?.toFixed(2),
        item.consumo?.toFixed(2) || '',
      ]);
      break;

    case 'leituras_operador':
      colunas = ['Operador', 'Total de Leituras', 'Dias Trabalhados', 'Média por Dia'];
      linhas = dados.map((item) => [
        item.nome,
        item.total_leituras.toString(),
        item.dias_trabalhados.toString(),
        item.leituras_por_dia.toString(),
      ]);
      break;

    case 'servicos_periodo':
    case 'servicos_agendados_executados':
      colunas = ['Data Agendamento', 'Cliente/Local', 'Tipo', 'Status', 'Operador', 'Data Execução'];
      linhas = dados.map((item) => [
        format(new Date(item.data_agendamento), 'dd/MM/yyyy', { locale: ptBR }),
        item.cliente_nome || item.nome_cliente,
        item.tipo_servico,
        item.status,
        item.operador_nome || '',
        item.data_execucao ? format(new Date(item.data_execucao), 'dd/MM/yyyy', { locale: ptBR }) : '',
      ]);
      break;

    case 'servicos_operador':
      colunas = ['Operador', 'Total Agendados', 'Concluídos', 'Em Andamento', 'Taxa de Conclusão'];
      linhas = dados.map((item) => [
        item.operador_nome,
        item.total_agendados.toString(),
        item.concluidos.toString(),
        item.em_andamento.toString(),
        `${item.taxa_conclusao}%`,
      ]);
      break;

    default:
      // Fallback genérico
      colunas = Object.keys(dados[0]);
      linhas = dados.map((item) => colunas.map((col) => String(item[col] || '')));
  }

  // Montar CSV
  const csvContent = [
    colunas.join(';'), // Header
    ...linhas.map((linha) => linha.map((cell) => `"${cell}"`).join(';')), // Dados
  ].join('\n');

  // Adicionar BOM para UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_${tipoRelatorio}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
