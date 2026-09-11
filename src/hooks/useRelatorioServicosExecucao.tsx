import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

const STATUS_FECHADO = ['executado', 'concluido'];

export function useRelatorioServicosExecucao() {
  const gerarRelatorioServicosExecucao = async (filtros: FiltrosRelatorioType): Promise<any[]> => {
    const { dataInicio, dataFim, operadorId, tipoServico, statusServico, ufFiltro } = filtros;

    let query = supabase
      .from('servicos_nacional_gas')
      .select(`
        id,
        data_agendamento,
        data_solicitacao,
        created_at,
        updated_at,
        tipo_servico,
        status_atendimento,
        observacao,
        condominio_nome_original,
        bloco,
        apartamento,
        uf,
        tecnico_id,
        valor_servico,
        operadores:tecnico_id(nome)
      `)
      .not('tipo_servico', 'ilike', '%leitura%')
      .range(0, 9999);

    if (operadorId) query = query.eq('tecnico_id', operadorId);
    if (tipoServico) query = query.eq('tipo_servico', tipoServico);
    if (statusServico) query = query.eq('status_atendimento', statusServico);
    if (ufFiltro) query = query.eq('uf', ufFiltro);

    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) throw new Error(`Erro servicos_nacional_gas: ${error.message}`);

    const servicos = data || [];

    // Data de fechamento: registro mais recente no histórico em que o status passou
    // para executado/concluído.
    const fechamentoPorServico = new Map<string, string>();
    const ids = servicos.map((s: any) => s.id);

    for (let i = 0; i < ids.length; i += 300) {
      const lote = ids.slice(i, i + 300);
      if (!lote.length) continue;
      const { data: hist, error: histError } = await supabase
        .from('servicos_nacional_gas_historico')
        .select('servico_id, valor_novo, created_at')
        .eq('campo_alterado', 'status_atendimento')
        .in('valor_novo', STATUS_FECHADO)
        .in('servico_id', lote)
        .order('created_at', { ascending: false });

      if (histError) throw new Error(`Erro histórico: ${histError.message}`);

      for (const h of hist || []) {
        if (!fechamentoPorServico.has(h.servico_id)) {
          fechamentoPorServico.set(h.servico_id, String(h.created_at).split('T')[0]);
        }
      }
    }

    let resultados: any[] = servicos.map((s: any) => {
      const fechado = STATUS_FECHADO.includes(String(s.status_atendimento || '').toLowerCase());
      const doHistorico = fechamentoPorServico.get(s.id) || null;
      const dataExecucao = doHistorico
        ? doHistorico
        : fechado && s.updated_at
        ? String(s.updated_at).split('T')[0]
        : null;

      return {
        data_execucao: dataExecucao,
        origem_data: doHistorico ? 'historico' : dataExecucao ? 'ultima_alteracao' : null,
        condominio: s.condominio_nome_original || '-',
        bloco: s.bloco || '',
        apartamento: s.apartamento || '',
        tipo_servico: s.tipo_servico,
        tecnico: s.operadores?.nome || 'Não atribuído',
        status: s.status_atendimento,
        valor_servico: s.valor_servico ?? null,
        uf: s.uf || '',
      };
    });

    // Janela de datas aplicada sobre a data de execução.
    // Registros sem data de execução só entram quando não há filtro de período.
    if (dataInicio || dataFim) {
      resultados = resultados.filter((r) => {
        if (!r.data_execucao) return false;
        if (dataInicio && r.data_execucao < dataInicio) return false;
        if (dataFim && r.data_execucao > dataFim) return false;
        return true;
      });
    }

    resultados.sort((a, b) => {
      if (!a.data_execucao && !b.data_execucao) return 0;
      if (!a.data_execucao) return 1;
      if (!b.data_execucao) return -1;
      return b.data_execucao.localeCompare(a.data_execucao);
    });

    return resultados;
  };

  return { gerarRelatorioServicosExecucao };
}
