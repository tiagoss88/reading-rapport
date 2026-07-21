
-- 1. Materiais
CREATE TABLE public.materiais (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;
GRANT ALL ON public.materiais TO service_role;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage materiais" ON public.materiais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_materiais_updated_at BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Movimentacoes
CREATE TABLE public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade numeric NOT NULL,
  motivo text,
  servico_id uuid REFERENCES public.servicos_nacional_gas(id) ON DELETE SET NULL,
  operador_id uuid,
  observacao text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_estoque_mov_material ON public.estoque_movimentacoes(material_id);
CREATE INDEX idx_estoque_mov_servico ON public.estoque_movimentacoes(servico_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage movimentacoes" ON public.estoque_movimentacoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. Receita por tipo de servico
CREATE TABLE public.tipo_servico_materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_servico text NOT NULL,
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  quantidade numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo_servico, material_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipo_servico_materiais TO authenticated;
GRANT ALL ON public.tipo_servico_materiais TO service_role;
ALTER TABLE public.tipo_servico_materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage receita" ON public.tipo_servico_materiais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_receita_updated_at BEFORE UPDATE ON public.tipo_servico_materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. View saldo
CREATE OR REPLACE VIEW public.v_estoque_saldo AS
SELECT
  m.id AS material_id,
  m.nome,
  m.unidade,
  m.categoria,
  m.estoque_minimo,
  m.ativo,
  COALESCE(SUM(CASE mv.tipo
    WHEN 'entrada' THEN mv.quantidade
    WHEN 'saida' THEN -mv.quantidade
    WHEN 'ajuste' THEN mv.quantidade
  END), 0) AS saldo
FROM public.materiais m
LEFT JOIN public.estoque_movimentacoes mv ON mv.material_id = m.id
GROUP BY m.id;
GRANT SELECT ON public.v_estoque_saldo TO authenticated;
GRANT ALL ON public.v_estoque_saldo TO service_role;

-- 5. Trigger de baixa automatica
CREATE OR REPLACE FUNCTION public.baixa_estoque_ao_executar_servico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status_atendimento = 'executado'
     AND (OLD.status_atendimento IS DISTINCT FROM NEW.status_atendimento)
     AND NEW.tipo_servico IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.estoque_movimentacoes
      WHERE servico_id = NEW.id AND tipo = 'saida'
    ) THEN
      INSERT INTO public.estoque_movimentacoes (material_id, tipo, quantidade, motivo, servico_id, criado_por)
      SELECT tsm.material_id, 'saida', tsm.quantidade,
             'Baixa automática: ' || NEW.tipo_servico,
             NEW.id, auth.uid()
      FROM public.tipo_servico_materiais tsm
      WHERE tsm.tipo_servico = NEW.tipo_servico;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_baixa_estoque
AFTER UPDATE ON public.servicos_nacional_gas
FOR EACH ROW EXECUTE FUNCTION public.baixa_estoque_ao_executar_servico();
