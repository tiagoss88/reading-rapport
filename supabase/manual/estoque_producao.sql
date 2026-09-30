-- =====================================================================
-- MÓDULO ESTOQUE — script para o banco do sistema publicado
-- Pode ser executado mais de uma vez sem problema (idempotente).
-- Ordem: tabelas -> saldo -> acesso -> baixa automática (por último).
-- =====================================================================

-- 1) TABELAS -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  unidade text NOT NULL DEFAULT 'un',
  categoria text,
  estoque_minimo numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade numeric NOT NULL,
  motivo text,
  servico_id uuid REFERENCES public.servicos_nacional_gas(id) ON DELETE SET NULL,
  operador_id uuid,
  observacao text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_material ON public.estoque_movimentacoes(material_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_servico ON public.estoque_movimentacoes(servico_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_created ON public.estoque_movimentacoes(created_at DESC);

CREATE TABLE IF NOT EXISTS public.tipo_servico_materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_servico text NOT NULL,
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  quantidade numeric NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo_servico, material_id)
);

DROP TRIGGER IF EXISTS trg_materiais_updated_at ON public.materiais;
CREATE TRIGGER trg_materiais_updated_at BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_receita_updated_at ON public.tipo_servico_materiais;
CREATE TRIGGER trg_receita_updated_at BEFORE UPDATE ON public.tipo_servico_materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) SALDO -------------------------------------------------------------
-- entrada soma, saída subtrai, ajuste soma o valor com sinal (+/-)
CREATE OR REPLACE VIEW public.v_estoque_saldo
WITH (security_invoker = true) AS
SELECT
  m.id AS material_id,
  m.nome,
  m.unidade,
  m.categoria,
  m.estoque_minimo,
  m.ativo,
  COALESCE(SUM(CASE
    WHEN e.tipo = 'entrada' THEN e.quantidade
    WHEN e.tipo = 'saida' THEN -e.quantidade
    WHEN e.tipo = 'ajuste' THEN e.quantidade
    ELSE 0 END), 0) AS saldo
FROM public.materiais m
LEFT JOIN public.estoque_movimentacoes e ON e.material_id = m.id
GROUP BY m.id;

-- 3) ACESSO (somente administradores) ---------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipo_servico_materiais TO authenticated;
GRANT SELECT ON public.v_estoque_saldo TO authenticated;
GRANT ALL ON public.materiais, public.estoque_movimentacoes, public.tipo_servico_materiais TO service_role;
GRANT SELECT ON public.v_estoque_saldo TO service_role;

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipo_servico_materiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estoque_admin_materiais" ON public.materiais;
CREATE POLICY "estoque_admin_materiais" ON public.materiais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "estoque_admin_movimentacoes" ON public.estoque_movimentacoes;
CREATE POLICY "estoque_admin_movimentacoes" ON public.estoque_movimentacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "estoque_admin_receitas" ON public.tipo_servico_materiais;
CREATE POLICY "estoque_admin_receitas" ON public.tipo_servico_materiais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) BAIXA AUTOMÁTICA AO EXECUTAR A OS (por último) --------------------
-- Protegida: se qualquer coisa falhar, a OS fecha normalmente e só a baixa não é feita.
CREATE OR REPLACE FUNCTION public.baixa_estoque_ao_executar_servico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    IF NEW.status_atendimento IN ('executado', 'concluido')
       AND OLD.status_atendimento IS DISTINCT FROM NEW.status_atendimento
       AND NEW.tipo_servico IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.estoque_movimentacoes
         WHERE servico_id = NEW.id AND tipo = 'saida'
       ) THEN
      INSERT INTO public.estoque_movimentacoes (material_id, tipo, quantidade, motivo, servico_id, operador_id, criado_por)
      SELECT tsm.material_id, 'saida', tsm.quantidade,
             'Baixa automática: ' || NEW.tipo_servico,
             NEW.id, NEW.tecnico_id, auth.uid()
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
                jsonb_build_object('servico_id', NEW.id, 'tipo_servico', NEW.tipo_servico);
      END IF;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_baixa_estoque ON public.servicos_nacional_gas;
CREATE TRIGGER trg_baixa_estoque
  AFTER UPDATE ON public.servicos_nacional_gas
  FOR EACH ROW EXECUTE FUNCTION public.baixa_estoque_ao_executar_servico();

-- Atualiza o cache da API para as novas tabelas aparecerem na hora
NOTIFY pgrst, 'reload schema';
