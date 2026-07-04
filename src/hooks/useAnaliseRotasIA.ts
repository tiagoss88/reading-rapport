import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RotaResumoIA {
  rota: number;
  uf: string;
  centroide: { lat: number; lng: number };
  total_medidores: number;
  qtd_pontos: number;
  bairros?: string[];
  distancia_media_km?: number;
}

export interface AnaliseIAResult {
  resumo_geral?: string;
  rotas?: Array<{ rota: number; nome_sugerido?: string; observacao?: string }>;
  alertas?: Array<{ severidade?: 'info' | 'aviso' | 'critico'; mensagem: string }>;
}

export function useAnaliseRotasIA() {
  return useMutation<AnaliseIAResult, Error, { rotas: RotaResumoIA[]; meta: { tecnicos?: number; meta_medidores?: number } }>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.functions.invoke('analisar-rotas-ia', { body: payload });
      if (error) throw new Error(error.message || 'Falha ao chamar análise de IA');
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as AnaliseIAResult;
    },
    onError: (err) => {
      toast.error(err.message || 'Erro na análise por IA');
    },
  });
}
