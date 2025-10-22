import { supabase } from '@/integrations/supabase/client';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioServicos() {
  const gerarRelatorioServicos = async (
    tipo: TipoRelatorio,
    filtros: FiltrosRelatorioType
  ): Promise<any[]> => {
    const { dataInicio, dataFim, empreendimentoId, operadorId, status, tipoServico } = filtros;

    switch (tipo) {
      case 'servicos_periodo':
      case 'servicos_agendados_executados': {
        let query = supabase
          .from('servicos')
          .select(`
            *,
            clientes!inner(nome, identificacao_unidade),
            operadores(nome)
          `)
          .gte('data_agendamento', dataInicio)
          .lte('data_agendamento', dataFim);

        if (empreendimentoId) {
          query = query.eq('empreendimento_id', empreendimentoId);
        }

        if (operadorId) {
          query = query.eq('operador_responsavel_id', operadorId);
        }

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query.order('data_agendamento', { ascending: false });

        if (error) throw error;

        return (
          data?.map((servico: any) => ({
            data_agendamento: servico.data_agendamento,
            cliente_nome: servico.clientes?.nome || servico.clientes?.identificacao_unidade,
            tipo_servico: servico.tipo_servico,
            status: servico.status,
            operador_nome: servico.operadores?.nome || 'Não atribuído',
            data_execucao: servico.data_execucao,
          })) || []
        );
      }

      case 'servicos_operador': {
        const { data, error } = await supabase
          .from('operadores')
          .select(`
            id,
            nome,
            servicos:servicos!operador_responsavel_id(status)
          `)
          .gte('servicos.data_agendamento', dataInicio)
          .lte('servicos.data_agendamento', dataFim);

        if (error) throw error;

        return (
          data?.map((operador: any) => {
            const servicos = operador.servicos || [];
            const totalAgendados = servicos.length;
            const concluidos = servicos.filter((s: any) => s.status === 'concluido').length;
            const emAndamento = servicos.filter((s: any) => s.status === 'em_andamento').length;
            const taxaConclusao = totalAgendados > 0 ? ((concluidos / totalAgendados) * 100).toFixed(1) : '0';

            return {
              operador_nome: operador.nome,
              total_agendados: totalAgendados,
              concluidos,
              em_andamento: emAndamento,
              taxa_conclusao: taxaConclusao,
            };
          }) || []
        );
      }

      case 'servicos_tipo': {
        let query = supabase
          .from('servicos')
          .select('tipo_servico, status')
          .gte('data_agendamento', dataInicio)
          .lte('data_agendamento', dataFim);

        if (tipoServico) {
          query = query.eq('tipo_servico', tipoServico);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Agrupar por tipo
        const agrupado = new Map<string, any>();

        data?.forEach((servico: any) => {
          if (!agrupado.has(servico.tipo_servico)) {
            agrupado.set(servico.tipo_servico, {
              tipo: servico.tipo_servico,
              total: 0,
              concluidos: 0,
            });
          }
          const grupo = agrupado.get(servico.tipo_servico);
          grupo.total++;
          if (servico.status === 'concluido') {
            grupo.concluidos++;
          }
        });

        return Array.from(agrupado.values());
      }

      case 'servicos_externos': {
        let query = supabase
          .from('servicos_externos')
          .select(`
            *,
            operadores(nome)
          `)
          .gte('data_agendamento', dataInicio)
          .lte('data_agendamento', dataFim);

        if (operadorId) {
          query = query.eq('operador_responsavel_id', operadorId);
        }

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query.order('data_agendamento', { ascending: false });

        if (error) throw error;

        return (
          data?.map((servico: any) => ({
            data_agendamento: servico.data_agendamento,
            nome_cliente: servico.nome_cliente,
            tipo_servico: servico.tipo_servico,
            status: servico.status,
            operador_nome: servico.operadores?.nome || 'Não atribuído',
            data_execucao: servico.data_execucao,
            endereco: servico.endereco_servico,
          })) || []
        );
      }

      default:
        return [];
    }
  };

  return { gerarRelatorioServicos };
}
