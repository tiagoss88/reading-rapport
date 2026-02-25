import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioCadastroCondominios() {
  const gerarRelatorioCadastroCondominios = async (filtros: FiltrosRelatorioType) => {
    let query = supabase
      .from('empreendimentos_terceirizados')
      .select('nome, uf, rota, quantidade_medidores')
      .order('uf')
      .order('nome');

    if (filtros.ufFiltro && filtros.ufFiltro !== 'todos') {
      query = query.eq('uf', filtros.ufFiltro);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    const resultados: any[] = [];
    let currentUf = '';
    let ufCount = 0;
    let ufMedidores = 0;
    let totalCount = 0;
    let totalMedidores = 0;

    for (const item of data) {
      if (currentUf && currentUf !== item.uf) {
        resultados.push({
          condominio: `Subtotal ${currentUf} (${ufCount} cond.)`,
          uf: currentUf,
          rota: null,
          qtd_medidores: ufMedidores,
          is_subtotal: true,
        });
        ufCount = 0;
        ufMedidores = 0;
      }
      currentUf = item.uf;
      ufCount++;
      ufMedidores += item.quantidade_medidores || 0;
      totalCount++;
      totalMedidores += item.quantidade_medidores || 0;

      resultados.push({
        condominio: item.nome,
        uf: item.uf,
        rota: item.rota,
        qtd_medidores: item.quantidade_medidores || 0,
      });
    }

    if (currentUf) {
      resultados.push({
        condominio: `Subtotal ${currentUf} (${ufCount} cond.)`,
        uf: currentUf,
        rota: null,
        qtd_medidores: ufMedidores,
        is_subtotal: true,
      });
    }

    resultados.push({
      condominio: `TOTAL GERAL (${totalCount} cond.)`,
      uf: '',
      rota: null,
      qtd_medidores: totalMedidores,
      is_subtotal: true,
    });

    return resultados;
  };

  return { gerarRelatorioCadastroCondominios };
}
