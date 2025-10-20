-- Adicionar colunas para melhorar rastreamento de operadores
ALTER TABLE operador_localizacoes
ADD COLUMN IF NOT EXISTS endereco_estimado TEXT,
ADD COLUMN IF NOT EXISTS fonte_localizacao TEXT,
ADD COLUMN IF NOT EXISTS precisao_rating TEXT CHECK (precisao_rating IN ('excelente', 'boa', 'aceitavel', 'ruim')),
ADD COLUMN IF NOT EXISTS tentativas_gps INTEGER DEFAULT 1;

-- Criar índice para melhor performance nas consultas de localização
CREATE INDEX IF NOT EXISTS idx_operador_localizacoes_timestamp 
ON operador_localizacoes(operador_id, timestamp DESC);