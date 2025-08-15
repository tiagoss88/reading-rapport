-- Adicionar campos para múltiplas fotos e dados de execução do serviço
ALTER TABLE public.servicos 
ADD COLUMN IF NOT EXISTS data_execucao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hora_inicio TIME,
ADD COLUMN IF NOT EXISTS hora_fim TIME,
ADD COLUMN IF NOT EXISTS descricao_servico_realizado TEXT,
ADD COLUMN IF NOT EXISTS materiais_utilizados TEXT,
ADD COLUMN IF NOT EXISTS observacoes_execucao TEXT,
ADD COLUMN IF NOT EXISTS fotos_servico TEXT[];