-- Desfaz SOMENTE a baixa automática de estoque ao executar OS.
-- Tabelas, materiais e movimentações são mantidos.
DROP TRIGGER IF EXISTS trg_baixa_estoque ON public.servicos_nacional_gas;
DROP FUNCTION IF EXISTS public.baixa_estoque_ao_executar_servico();
NOTIFY pgrst, 'reload schema';
