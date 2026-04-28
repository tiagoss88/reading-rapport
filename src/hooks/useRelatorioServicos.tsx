import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioServicos() {
  const gerarRelatorioServicos = async (filtros: FiltrosRelatorioType): Promise<any[]> => {
    const { dataInicio, dataFim, operadorId, tipoServico, statusServico, ufFiltro } = filtros;

    // Busca ampla — sem filtro de data no SQL para não descartar registros
    // com data_agendamento NULL (pendentes). Filtramos por data efetiva no JS.
    let query = supabase
      .from('servicos_nacional_gas')
      .select(`
        id,
        data_agendamento,
        data_solicitacao,
        created_at,
        tipo_servico,
        status_atendimento,
        observacao,
        condominio_nome_original,
        uf,
        tecnico_id,
        operadores:tecnico_id(nome)
      `)
      // Excluir registros de leitura — RDO trata só serviços (religação, desligamento, visita técnica, etc.)
      .not('tipo_servico', 'ilike', '%leitura%')
      .range(0, 9999);

    if (operadorId) {
      query = query.eq('tecnico_id', operadorId);
    }
    if (tipoServico) {
      query = query.eq('tipo_servico', tipoServico);
    }
    if (statusServico) {
      query = query.eq('status_atendimento', statusServico);
    }
    if (ufFiltro) {
      query = query.eq('uf', ufFiltro);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Erro servicos_nacional_gas: ${error.message}`);

    // Data efetiva: agendamento → solicitação → criação
    const getDataEfetiva = (s: any): string | null => {
      if (s.data_agendamento) return s.data_agendamento;
      if (s.data_solicitacao) return s.data_solicitacao;
      if (s.created_at) return String(s.created_at).split('T')[0];
      return null;
    };

    let resultados: any[] = (data || []).map((s: any) => {
      const dataEfetiva = getDataEfetiva(s);
      return {
        data: dataEfetiva,
        condominio: s.condominio_nome_original || '-',
        tipo_servico: s.tipo_servico,
        tecnico: s.operadores?.nome || 'Não atribuído',
        status: s.status_atendimento,
        descricao: s.observacao || '',
      };
    });

    // Filtro de janela de data aplicado no JS — inclusivo nas duas pontas.
    // Registros sem data efetiva são mantidos (não somem).
    if (dataInicio) {
      resultados = resultados.filter((r) => !r.data || r.data >= dataInicio);
    }
    if (dataFim) {
      resultados = resultados.filter((r) => !r.data || r.data <= dataFim);
    }

    // Sort by date desc — registros sem data vão para o fim
    resultados.sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });

    return resultados;
  };

  return { gerarRelatorioServicos };
}
