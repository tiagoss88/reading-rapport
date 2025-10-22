import { supabase } from '@/integrations/supabase/client';
import { TipoRelatorio, FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioLeituras() {
  const gerarRelatorioLeituras = async (
    tipo: TipoRelatorio,
    filtros: FiltrosRelatorioType
  ): Promise<any[]> => {
    const { dataInicio, dataFim, empreendimentoId, operadorId } = filtros;

    switch (tipo) {
      case 'leituras_periodo': {
        let query = supabase
          .from('leituras')
          .select(`
            *,
            clientes!inner(id, identificacao_unidade, nome, empreendimento_id, empreendimentos!inner(nome)),
            operadores!inner(nome)
          `)
          .gte('data_leitura', dataInicio)
          .lte('data_leitura', dataFim)
          .order('data_leitura', { ascending: false });

        if (empreendimentoId) {
          query = query.eq('clientes.empreendimento_id', empreendimentoId);
        }

        if (operadorId) {
          query = query.eq('operador_id', operadorId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcular consumo
        const clientesLeituras = new Map<string, any[]>();
        
        data?.forEach((leitura: any) => {
          const clienteId = leitura.clientes.id;
          if (!clientesLeituras.has(clienteId)) {
            clientesLeituras.set(clienteId, []);
          }
          clientesLeituras.get(clienteId)!.push(leitura);
        });

        const resultado = data?.map((leitura: any) => {
          const leiturasPrevias = clientesLeituras
            .get(leitura.clientes.id)
            ?.filter((l: any) => new Date(l.data_leitura) < new Date(leitura.data_leitura))
            .sort((a: any, b: any) => new Date(b.data_leitura).getTime() - new Date(a.data_leitura).getTime());

          const leituraAnterior = leiturasPrevias?.[0]?.leitura_atual;
          const consumo = leituraAnterior ? leitura.leitura_atual - leituraAnterior : null;

          return {
            data_leitura: leitura.data_leitura,
            cliente_nome: leitura.clientes.nome || leitura.clientes.identificacao_unidade,
            empreendimento: leitura.clientes.empreendimentos.nome,
            operador: leitura.operadores.nome,
            leitura_anterior: leituraAnterior,
            leitura_atual: leitura.leitura_atual,
            consumo,
          };
        });

        return resultado || [];
      }

      case 'leituras_operador': {
        let query = supabase
          .from('leituras')
          .select(`
            *,
            operadores!inner(id, nome)
          `)
          .gte('data_leitura', dataInicio)
          .lte('data_leitura', dataFim);

        if (operadorId) {
          query = query.eq('operador_id', operadorId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Agrupar por operador
        const agrupado = new Map<string, any>();

        data?.forEach((leitura: any) => {
          const opNome = leitura.operadores.nome;
          if (!agrupado.has(opNome)) {
            agrupado.set(opNome, {
              nome: opNome,
              total_leituras: 0,
              dias_trabalhados: new Set<string>(),
            });
          }
          const grupo = agrupado.get(opNome);
          grupo.total_leituras++;
          grupo.dias_trabalhados.add(new Date(leitura.data_leitura).toISOString().split('T')[0]);
        });

        return Array.from(agrupado.values()).map((item) => ({
          nome: item.nome,
          total_leituras: item.total_leituras,
          dias_trabalhados: item.dias_trabalhados.size,
          leituras_por_dia: (item.total_leituras / item.dias_trabalhados.size).toFixed(2),
        }));
      }

      case 'leituras_empreendimento': {
        let query = supabase
          .from('leituras')
          .select(`
            *,
            clientes!inner(empreendimento_id, empreendimentos!inner(nome))
          `)
          .gte('data_leitura', dataInicio)
          .lte('data_leitura', dataFim);

        if (empreendimentoId) {
          query = query.eq('clientes.empreendimento_id', empreendimentoId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Agrupar por empreendimento
        const agrupado = new Map<string, any>();

        data?.forEach((leitura: any) => {
          const empNome = leitura.clientes.empreendimentos.nome;
          if (!agrupado.has(empNome)) {
            agrupado.set(empNome, {
              empreendimento: empNome,
              total_leituras: 0,
              leituras: [],
            });
          }
          const grupo = agrupado.get(empNome);
          grupo.total_leituras++;
          grupo.leituras.push(leitura.leitura_atual);
        });

        return Array.from(agrupado.values()).map((item) => ({
          ...item,
          media_leitura: (item.leituras.reduce((a: number, b: number) => a + b, 0) / item.leituras.length).toFixed(2),
        }));
      }

      case 'leituras_pendentes': {
        const { data, error } = await supabase
          .from('leituras')
          .select(`
            *,
            clientes!inner(identificacao_unidade, nome, empreendimentos!inner(nome)),
            operadores!inner(nome)
          `)
          .eq('status_sincronizacao', 'pendente')
          .gte('data_leitura', dataInicio)
          .lte('data_leitura', dataFim);

        if (error) throw error;
        return data || [];
      }

      case 'leituras_observacoes': {
        const { data, error } = await supabase
          .from('leituras')
          .select(`
            *,
            clientes!inner(identificacao_unidade, nome, empreendimentos!inner(nome)),
            operadores!inner(nome)
          `)
          .not('observacao', 'is', null)
          .gte('data_leitura', dataInicio)
          .lte('data_leitura', dataFim);

        if (error) throw error;
        return data || [];
      }

      default:
        return [];
    }
  };

  return { gerarRelatorioLeituras };
}
