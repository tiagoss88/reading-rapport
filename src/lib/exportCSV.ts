import { TipoRelatorio } from '@/pages/Relatorios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function exportarCSV(tipoRelatorio: TipoRelatorio, dados: any[]) {
  if (dados.length === 0) throw new Error('Não há dados para exportar');

  let colunas: string[] = [];
  let linhas: string[][] = [];

  switch (tipoRelatorio) {
    case 'condominios_competencia':
      colunas = ['Condomínio', 'UF', 'Qtd Medidores', 'Data da Coleta'];
      linhas = dados.map((item) => [
        item.condominio,
        item.uf || '',
        item.qtd_medidores.toString(),
        item.data_coleta ? format(new Date(item.data_coleta), 'dd/MM/yyyy', { locale: ptBR }) : '',
      ]);
      break;

    case 'cadastro_condominios_uf':
      colunas = ['Condomínio', 'UF', 'Rota', 'Qtd Medidores'];
      linhas = dados.map((item) => [
        item.condominio,
        item.uf || '',
        item.rota != null ? String(item.rota) : '--',
        String(item.qtd_medidores),
      ]);
      break;

    case 'rdo_servicos':
      colunas = ['Data', 'Condomínio', 'Tipo Serviço', 'Técnico', 'Status'];
      linhas = dados.map((item) => [
        item.data ? format(new Date(item.data), 'dd/MM/yyyy', { locale: ptBR }) : '',
        item.condominio || '',
        item.tipo_servico?.toUpperCase(),
        item.tecnico || '',
        item.status,
      ]);
      break;

    default:
      colunas = Object.keys(dados[0]);
      linhas = dados.map((item) => colunas.map((col) => String(item[col] || '')));
  }

  const csvContent = [
    colunas.join(';'),
    ...linhas.map((linha) => linha.map((cell) => `"${cell}"`).join(';')),
  ].join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_${tipoRelatorio}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
