-- Fase 1: Controle de Competência

-- 1. Adicionar campos essenciais à tabela leituras
ALTER TABLE leituras 
  ADD COLUMN competencia VARCHAR(7),
  ADD COLUMN tipo_leitura VARCHAR(50) DEFAULT 'normal';

-- 2. Preencher competencias existentes baseado na data_leitura
UPDATE leituras 
SET competencia = TO_CHAR(data_leitura, 'YYYY-MM')
WHERE competencia IS NULL;

-- 3. Tornar competencia obrigatório
ALTER TABLE leituras 
  ALTER COLUMN competencia SET NOT NULL;

-- 4. Criar constraint de unicidade: apenas uma leitura 'normal' por cliente por competência
CREATE UNIQUE INDEX idx_leituras_cliente_competencia_normal 
  ON leituras (cliente_id, competencia) 
  WHERE tipo_leitura = 'normal';

-- 5. Índices para melhorar performance
CREATE INDEX idx_leituras_competencia ON leituras (competencia);
CREATE INDEX idx_leituras_tipo ON leituras (tipo_leitura);

-- 6. Adicionar comentários para documentação
COMMENT ON COLUMN leituras.competencia IS 'Competência da leitura no formato YYYY-MM';
COMMENT ON COLUMN leituras.tipo_leitura IS 'Tipo de leitura: normal, final_titularidade, inicial_titularidade';