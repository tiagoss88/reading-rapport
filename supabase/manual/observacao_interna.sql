-- Observação interna da OS (não sai no relatório do cliente) - idempotente
ALTER TABLE public.servicos_nacional_gas ADD COLUMN IF NOT EXISTS observacao_interna text;
NOTIFY pgrst, 'reload schema';
