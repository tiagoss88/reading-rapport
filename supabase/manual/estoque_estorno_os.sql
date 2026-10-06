-- =====================================================================
-- ESTOQUE - Devolve ao estoque as saídas de uma OS excluída (idempotente)
-- Requer: estoque_armazens.sql já executado.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.estornar_estoque_ao_excluir_servico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO public.estoque_movimentacoes (material_id, armazem_id, tipo, quantidade, motivo, observacao, criado_por)
    SELECT m.material_id, m.armazem_id, 'entrada', m.quantidade,
           trim('Estorno - OS excluída ' || coalesce(OLD.numero_protocolo, '')),
           '[estorno:' || m.id || ']', auth.uid()
      FROM public.estoque_movimentacoes m
     WHERE m.servico_id = OLD.id AND m.tipo = 'saida'
       AND NOT EXISTS (SELECT 1 FROM public.estoque_movimentacoes e
                        WHERE e.observacao LIKE '%[estorno:' || m.id || ']%');
  EXCEPTION WHEN others THEN
    BEGIN
      IF to_regclass('public.logs_erro') IS NOT NULL THEN
        EXECUTE 'INSERT INTO public.logs_erro (severidade, mensagem, detalhes, rota, contexto) VALUES ($1,$2,$3,$4,$5)'
          USING 'warning', 'Estorno de estoque ao excluir OS falhou', SQLERRM, 'trigger:estorno_estoque',
                jsonb_build_object('servico_id', OLD.id, 'protocolo', OLD.numero_protocolo);
      END IF;
    EXCEPTION WHEN others THEN NULL;
    END;
  END;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS trg_estorno_estoque_excluir ON public.servicos_nacional_gas;
CREATE TRIGGER trg_estorno_estoque_excluir BEFORE DELETE ON public.servicos_nacional_gas
  FOR EACH ROW EXECUTE FUNCTION public.estornar_estoque_ao_excluir_servico();

NOTIFY pgrst, 'reload schema';
