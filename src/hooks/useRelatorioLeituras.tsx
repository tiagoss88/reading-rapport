import { supabase } from '@/integrations/supabase/client';
import { FiltrosRelatorioType } from '@/pages/Relatorios';

export function useRelatorioLeituras() {
  const gerarRelatorioLeituras = async (filtros: FiltrosRelatorioType): Promise<any[]> => {
    const { competencia } = filtros;

    if (!competencia) throw new Error('Selecione uma competência');

    // Query leituras for the selected competencia, grouped by empreendimento
    const { data, error } = await supabase
      .from('leituras')
      .select(`
        id,
        data_leitura,
        competencia,
        clientes!inner(
          id,
          empreendimento_id,
          empreendimentos!inner(id, nome, endereco)
        )
      `)
      .eq('competencia', competencia);

    if (error) throw new Error(`Erro ao buscar leituras: ${error.message}`);
    if (!data || data.length === 0) return [];

    // Group by empreendimento
    const agrupado = new Map<string, {
      condominio: string;
      uf: string;
      qtd_medidores: Set<string>;
      data_coleta: string;
    }>();

    data.forEach((leitura: any) => {
      const emp = leitura.clientes?.empreendimentos;
      if (!emp) return;

      const empId = emp.id;
      if (!agrupado.has(empId)) {
        agrupado.set(empId, {
          condominio: emp.nome,
          uf: emp.endereco || '',
          qtd_medidores: new Set<string>(),
          data_coleta: leitura.data_leitura,
        });
      }

      const grupo = agrupado.get(empId)!;
      grupo.qtd_medidores.add(leitura.clientes.id);

      // Keep earliest collection date
      if (leitura.data_leitura < grupo.data_coleta) {
        grupo.data_coleta = leitura.data_leitura;
      }
    });

    return Array.from(agrupado.values()).map((item) => ({
      condominio: item.condominio,
      uf: item.uf,
      qtd_medidores: item.qtd_medidores.size,
      data_coleta: item.data_coleta,
    }));
  };

  return { gerarRelatorioLeituras };
}
