import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

// Converte um timestamp ISO (UTC) para a data local de Brasília (UTC-3) em YYYY-MM-DD
function dataLocalBR(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return local.toISOString().split('T')[0];
}

function diffDias(dataSolicitacao: string, dataInclusao: string): number {
  const a = new Date(`${dataSolicitacao}T00:00:00`).getTime();
  const b = new Date(`${dataInclusao}T00:00:00`).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function useRelatorioServicosRecebidosAtraso() {
  const gerarRelatorioServicosRecebidosAtraso = async (
    filtros: FiltrosRelatorioType
  ): Promise<any[]> => {
    const { dataInicio, dataFim, tipoServico, statusServico, ufFiltro } = filtros;
    const atrasoMinimo = Number(filtros.atrasoMinimoDias ?? 1) || 1;

    let query = supabase
      .from('servicos_nacional_gas')
      .select(
        `
        id,
        numero_protocolo,
        data_solicitacao,
        created_at,
        tipo_servico,
        status_atendimento,
        condominio_nome_original,
        bloco,
        apartamento,
        uf
      `
      )
      .not('data_solicitacao', 'is', null)
      .range(0, 9999);

    if (tipoServico) query = query.eq('tipo_servico', tipoServico);
    if (statusServico) query = query.eq('status_atendimento', statusServico);
    if (ufFiltro) query = query.eq('uf', ufFiltro);
    if (dataInicio) query = query.gte('created_at', `${dataInicio}T00:00:00-03:00`);
    if (dataFim) query = query.lte('created_at', `${dataFim}T23:59:59-03:00`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`Erro servicos_nacional_gas: ${error.message}`);

    const resultados = (data || [])
      .map((s: any) => {
        const dataInclusao = dataLocalBR(s.created_at);
        return {
          protocolo: s.numero_protocolo || '-',
          uf: s.uf || '',
          condominio: s.condominio_nome_original || '-',
          bloco: s.bloco || '',
          apartamento: s.apartamento || '',
          tipo_servico: s.tipo_servico,
          data_solicitacao: s.data_solicitacao,
          data_inclusao: dataInclusao,
          hora_inclusao: s.created_at,
          dias_atraso: diffDias(s.data_solicitacao, dataInclusao),
          status: s.status_atendimento,
        };
      })
      .filter((r) => r.dias_atraso >= atrasoMinimo)
      .sort((a, b) => b.dias_atraso - a.dias_atraso);

    return resultados;
  };

  return { gerarRelatorioServicosRecebidosAtraso };
}
