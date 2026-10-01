-- =====================================================================
-- ESTOQUE — ARMAZÉNS (rodar DEPOIS de estoque_producao.sql)
-- Pode ser executado mais de uma vez sem problema (idempotente).
-- =====================================================================

-- 1) TABELA DE ARMAZÉNS -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.armazens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  uf text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.armazens TO authenticated;
GRANT ALL ON public.armazens TO service_role;
ALTER TABLE public.armazens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_admin_armazens" ON public.armazens;
CREATE POLICY "estoque_admin_armazens" ON public.armazens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_armazens_updated_at ON public.armazens;
CREATE TRIGGER trg_armazens_updated_at BEFORE UPDATE ON public.armazens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) MOVIMENTAÇÕES LIGADAS AO ARMAZÉM -----------------------------------
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS armazem_id uuid REFERENCES public.armazens(id) ON DELETE RESTRICT;
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS transferencia_id uuid;
CREATE INDEX IF NOT EXISTS idx_estoque_mov_armazem ON public.estoque_movimentacoes(armazem_id);

-- Movimentações antigas vão para o armazém "Principal"
DO $$
DECLARE v_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.estoque_movimentacoes WHERE armazem_id IS NULL) THEN
    SELECT id INTO v_id FROM public.armazens WHERE nome = 'Principal' LIMIT 1;
    IF v_id IS NULL THEN
      INSERT INTO public.armazens (nome) VALUES ('Principal') RETURNING id INTO v_id;
    END IF;
    UPDATE public.estoque_movimentacoes SET armazem_id = v_id WHERE armazem_id IS NULL;
  END IF;
END $$;
ALTER TABLE public.estoque_movimentacoes ALTER COLUMN armazem_id SET NOT NULL;

-- 3) SALDO POR ARMAZÉM ---------------------------------------------------
CREATE OR REPLACE VIEW public.v_estoque_saldo_armazem
WITH (security_invoker = true) AS
SELECT e.material_id, e.armazem_id,
  COALESCE(SUM(CASE
    WHEN e.tipo = 'entrada' THEN e.quantidade
    WHEN e.tipo = 'saida' THEN -e.quantidade
    WHEN e.tipo = 'ajuste' THEN e.quantidade
    ELSE 0 END), 0) AS saldo
FROM public.estoque_movimentacoes e
GROUP BY e.material_id, e.armazem_id;
GRANT SELECT ON public.v_estoque_saldo_armazem TO authenticated, service_role;

-- 4) TRANSFERÊNCIA ENTRE ARMAZÉNS ----------------------------------------
CREATE OR REPLACE FUNCTION public.transferir_estoque(
  _material_id uuid, _origem uuid, _destino uuid, _quantidade numeric, _observacao text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_tid uuid := gen_random_uuid(); v_o text; v_d text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _origem = _destino THEN RAISE EXCEPTION 'Origem e destino devem ser diferentes'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT nome INTO v_o FROM public.armazens WHERE id = _origem;
  SELECT nome INTO v_d FROM public.armazens WHERE id = _destino;
  IF v_o IS NULL OR v_d IS NULL THEN RAISE EXCEPTION 'Armazém não encontrado'; END IF;
  INSERT INTO public.estoque_movimentacoes (material_id, armazem_id, tipo, quantidade, motivo, observacao, transferencia_id, criado_por)
  VALUES (_material_id, _origem, 'saida', _quantidade, 'Transferência para ' || v_d, _observacao, v_tid, auth.uid()),
         (_material_id, _destino, 'entrada', _quantidade, 'Transferência de ' || v_o, _observacao, v_tid, auth.uid());
  RETURN v_tid;
END;
$$;
REVOKE ALL ON FUNCTION public.transferir_estoque(uuid, uuid, uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transferir_estoque(uuid, uuid, uuid, numeric, text) TO authenticated;

-- 5) BAIXA AUTOMÁTICA PELO ESTADO DA OS -----------------------------------
-- Protegida: se algo falhar (ou não houver armazém do estado), a OS fecha normalmente.
CREATE OR REPLACE FUNCTION public.baixa_estoque_ao_executar_servico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_armazem uuid;
BEGIN
  BEGIN
    IF NEW.status_atendimento IN ('executado', 'concluido')
       AND OLD.status_atendimento IS DISTINCT FROM NEW.status_atendimento
       AND NEW.tipo_servico IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.tipo_servico_materiais tsm
                   WHERE upper(trim(tsm.tipo_servico)) = upper(trim(NEW.tipo_servico)))
       AND NOT EXISTS (SELECT 1 FROM public.estoque_movimentacoes
                       WHERE servico_id = NEW.id AND tipo = 'saida') THEN
      SELECT id INTO v_armazem FROM public.armazens
       WHERE ativo AND upper(trim(uf)) = upper(trim(NEW.uf))
       ORDER BY created_at LIMIT 1;
      IF v_armazem IS NULL THEN
        RAISE EXCEPTION 'Nenhum armazém ativo para a UF %', NEW.uf;
      END IF;
      INSERT INTO public.estoque_movimentacoes (material_id, armazem_id, tipo, quantidade, motivo, servico_id, operador_id, criado_por)
      SELECT tsm.material_id, v_armazem, 'saida', tsm.quantidade,
             'Baixa automática: ' || NEW.tipo_servico, NEW.id, NEW.tecnico_id, auth.uid()
      FROM public.tipo_servico_materiais tsm
      JOIN public.materiais m ON m.id = tsm.material_id AND m.ativo
      WHERE upper(trim(tsm.tipo_servico)) = upper(trim(NEW.tipo_servico));
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'Baixa de estoque ignorada para o serviço %: %', NEW.id, SQLERRM;
    BEGIN
      IF to_regclass('public.logs_erro') IS NOT NULL THEN
        EXECUTE 'INSERT INTO public.logs_erro (severidade, mensagem, detalhes, rota, contexto) VALUES ($1, $2, $3, $4, $5)'
          USING 'warning', 'Baixa automática de estoque falhou', SQLERRM, 'trigger:baixa_estoque',
                jsonb_build_object('servico_id', NEW.id, 'tipo_servico', NEW.tipo_servico, 'uf', NEW.uf);
      END IF;
    EXCEPTION WHEN others THEN NULL;
    END;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_baixa_estoque ON public.servicos_nacional_gas;
CREATE TRIGGER trg_baixa_estoque
  AFTER UPDATE ON public.servicos_nacional_gas
  FOR EACH ROW EXECUTE FUNCTION public.baixa_estoque_ao_executar_servico();

NOTIFY pgrst, 'reload schema';
