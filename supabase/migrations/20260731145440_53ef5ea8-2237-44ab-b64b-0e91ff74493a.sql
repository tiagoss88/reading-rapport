-- Policies: materiais
DROP POLICY IF EXISTS "Admin manage materiais" ON public.materiais;
CREATE POLICY "Authenticated can view materiais" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage materiais" ON public.materiais FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Policies: tipo_servico_materiais
DROP POLICY IF EXISTS "Admin manage receita" ON public.tipo_servico_materiais;
CREATE POLICY "Authenticated can view receita" ON public.tipo_servico_materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage receita" ON public.tipo_servico_materiais FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Policies: estoque_movimentacoes
DROP POLICY IF EXISTS "Admin manage movimentacoes" ON public.estoque_movimentacoes;
CREATE POLICY "Authenticated can view movimentacoes" ON public.estoque_movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert movimentacoes" ON public.estoque_movimentacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins update movimentacoes" ON public.estoque_movimentacoes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete movimentacoes" ON public.estoque_movimentacoes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;
GRANT ALL ON public.materiais TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipo_servico_materiais TO authenticated;
GRANT ALL ON public.tipo_servico_materiais TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;

-- Saldo por material
CREATE OR REPLACE VIEW public.materiais_saldo
WITH (security_invoker = true) AS
SELECT
  m.id,
  m.nome,
  m.descricao,
  m.unidade,
  m.categoria,
  m.estoque_minimo,
  m.ativo,
  m.created_at,
  m.updated_at,
  COALESCE(SUM(CASE WHEN em.tipo = 'entrada' THEN em.quantidade
                    WHEN em.tipo = 'saida' THEN -em.quantidade
                    WHEN em.tipo = 'ajuste' THEN em.quantidade
                    ELSE 0 END), 0) AS saldo
FROM public.materiais m
LEFT JOIN public.estoque_movimentacoes em ON em.material_id = m.id
GROUP BY m.id;

GRANT SELECT ON public.materiais_saldo TO authenticated;
GRANT ALL ON public.materiais_saldo TO service_role;