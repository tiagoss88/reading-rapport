GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;
GRANT ALL ON public.materiais TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipo_servico_materiais TO authenticated;
GRANT ALL ON public.tipo_servico_materiais TO service_role;

GRANT SELECT ON public.v_estoque_saldo TO authenticated;
GRANT SELECT ON public.v_estoque_saldo TO service_role;

NOTIFY pgrst, 'reload schema';