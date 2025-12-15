-- Adicionar colunas de geolocalização à tabela empreendimentos_terceirizados
ALTER TABLE empreendimentos_terceirizados 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;