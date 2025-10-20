-- Adicionar coluna CEP à tabela empreendimentos
ALTER TABLE public.empreendimentos 
ADD COLUMN cep TEXT;

-- Criar índice para facilitar buscas por CEP
CREATE INDEX idx_empreendimentos_cep ON public.empreendimentos(cep);