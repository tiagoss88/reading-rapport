REVOKE ALL ON public.materiais FROM anon;
REVOKE ALL ON public.estoque_movimentacoes FROM anon;
REVOKE ALL ON public.tipo_servico_materiais FROM anon;
REVOKE ALL ON public.v_estoque_saldo FROM anon;

NOTIFY pgrst, 'reload schema';