import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioServicos() {
  const gerarRelatorioServicos = async (filtros: FiltrosRelatorioType): Promise<any[]> => {
    const { dataInicio, dataFim, operadorId, tipoServico, statusServico } = filtros;

    const addOneDay = (dateStr: string) => {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    };
    const fimExclusivo = addOneDay(dataFim);

    // Query servicos internos
    let queryInternos = supabase
      .from('servicos')
      .select(`
        id,
        data_agendamento,
        data_execucao,
        tipo_servico,
        status,
        descricao_servico_realizado,
        observacoes,
        empreendimentos!inner(nome),
        operadores(nome)
      `)
      .gte('data_agendamento', dataInicio)
      .lt('data_agendamento', fimExclusivo);

    if (operadorId) {
      queryInternos = queryInternos.eq('operador_responsavel_id', operadorId);
    }
    if (tipoServico) {
      queryInternos = queryInternos.eq('tipo_servico', tipoServico);
    }
    if (statusServico) {
      queryInternos = queryInternos.eq('status', statusServico);
    }

    // Query servicos nacional gas
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

    const [resInternos, resNacionalGas] = await Promise.all([
      queryInternos.order('data_agendamento', { ascending: false }),
      queryNacionalGas.order('data_agendamento', { ascending: false }),
    ]);

    if (resInternos.error) throw new Error(`Erro servicos: ${resInternos.error.message}`);
    if (resNacionalGas.error) throw new Error(`Erro servicos_nacional_gas: ${resNacionalGas.error.message}`);

    const resultados: any[] = [];

    // Map servicos internos
    resInternos.data?.forEach((s: any) => {
      resultados.push({
        data: s.data_execucao || s.data_agendamento,
        condominio: s.empreendimentos?.nome || '-',
        tipo_servico: s.tipo_servico,
        tecnico: s.operadores?.nome || 'Não atribuído',
        status: s.status,
        descricao: s.descricao_servico_realizado || s.observacoes || '',
      });
    });

    // Map servicos nacional gas
    resNacionalGas.data?.forEach((s: any) => {
      resultados.push({
        data: s.data_agendamento,
        condominio: s.condominio_nome_original || '-',
        tipo_servico: s.tipo_servico,
        tecnico: s.operadores?.nome || 'Não atribuído',
        status: s.status_atendimento,
        descricao: s.observacao || '',
      });
    });

    // Sort by date desc
    resultados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return resultados;
  };

  return { gerarRelatorioServicos };
}
