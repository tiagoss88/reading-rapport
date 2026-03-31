import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioColetasSemPendencia() {
  const gerarRelatorioColetasSemPendencia = async (filtros: FiltrosRelatorioType) => {
    let query = supabase
      .from('servicos_nacional_gas')
      .select(`
        id,
        condominio_nome_original,
        uf,
        data_agendamento,
        observacao,
        tecnico:operadores!servicos_nacional_gas_tecnico_id_fkey(nome),
        empreendimento:empreendimentos_terceirizados!servicos_nacional_gas_empreendimento_id_fkey(nome)
      `)
      .eq('tipo_servico', 'leitura')
      .eq('status_atendimento', 'executado');

    // Filter by competência (month)
    if (filtros.competencia) {
      const [ano, mes] = filtros.competencia.split('-');
      const inicioMes = `${ano}-${mes}-01`;
      const proximoMes = parseInt(mes) === 12
        ? `${parseInt(ano) + 1}-01-01`
        : `${ano}-${String(parseInt(mes) + 1).padStart(2, '0')}-01`;
      query = query.gte('data_agendamento', inicioMes).lt('data_agendamento', proximoMes);
    }

    if (filtros.ufFiltro) {
      query = query.eq('uf', filtros.ufFiltro);
    }

    if (filtros.operadorId) {
      query = query.eq('tecnico_id', filtros.operadorId);
    }

    query = query.order('data_agendamento', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const resultados = (data || []).map((item: any) => ({
      condominio: item.empreendimento?.nome || item.condominio_nome_original,
      uf: item.uf,
      tecnico: item.tecnico?.nome || '-',
      data_coleta: item.data_agendamento,
      observacao: item.observacao || '',
    }));

    return resultados;
  };

  return { gerarRelatorioColetasSemPendencia };
}
