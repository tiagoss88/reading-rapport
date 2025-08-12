-- Adicionar campo CNPJ à tabela empreendimentos
ALTER TABLE public.empreendimentos 
ADD COLUMN cnpj TEXT;

-- Adicionar campos nome e CPF à tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN nome TEXT,
ADD COLUMN cpf TEXT;