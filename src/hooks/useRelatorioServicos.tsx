import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioServicos() {
  const gerarRelatorioServicos = async (filtros: FiltrosRelatorioType): Promise<any[]> => {
    const { dataInicio, dataFim, operadorId, tipoServico, statusServico, ufFiltro } = filtros;

    const addOneDay = (dateStr: string) => {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    };
    const fimExclusivo = addOneDay(dataFim);

    // Query exclusiva: servicos_nacional_gas (escopo do RDO Nacional Gás)
    let queryNacionalGas = supabase
      .from('servicos_nacional_gas')
      .select(`
        id,
        data_agendamento,
        tipo_servico,
        status_atendimento,
        observacao,
        condominio_nome_original,
        uf,
        operadores:tecnico_id(nome)
      `)
      .gte('data_agendamento', dataInicio)
      .lt('data_agendamento', fimExclusivo);

    if (operadorId) {
      queryNacionalGas = queryNacionalGas.eq('tecnico_id', operadorId);
    }
    if (tipoServico) {
      queryNacionalGas = queryNacionalGas.eq('tipo_servico', tipoServico);
    }
    if (statusServico) {
      queryNacionalGas = queryNacionalGas.eq('status_atendimento', statusServico);
    }
    if (ufFiltro) {
      queryNacionalGas = queryNacionalGas.eq('uf', ufFiltro);
    }

    const { data, error } = await queryNacionalGas.order('data_agendamento', { ascending: false });

    if (error) throw new Error(`Erro servicos_nacional_gas: ${error.message}`);

    const resultados: any[] = (data || []).map((s: any) => ({
      data: s.data_agendamento,
      condominio: s.condominio_nome_original || '-',
      tipo_servico: s.tipo_servico,
      tecnico: s.operadores?.nome || 'Não atribuído',
      status: s.status_atendimento,
      descricao: s.observacao || '',
    }));

    // Sort by date desc
    resultados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return resultados;
  };

  return { gerarRelatorioServicos };
}
