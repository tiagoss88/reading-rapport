-- Criar tabela de localizações dos operadores
CREATE TABLE IF NOT EXISTS operador_localizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id UUID REFERENCES operadores(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  precisao NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  bateria_nivel INTEGER,
  em_movimento BOOLEAN DEFAULT false,
  velocidade NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_operador_localizacoes_operador_id ON operador_localizacoes(operador_id);
CREATE INDEX idx_operador_localizacoes_timestamp ON operador_localizacoes(timestamp DESC);

-- Enable RLS
ALTER TABLE operador_localizacoes ENABLE ROW LEVEL SECURITY;

-- Operadores podem inserir suas próprias localizações
CREATE POLICY "Operadores podem inserir suas localizações" ON operador_localizacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operadores 
      WHERE operadores.id = operador_localizacoes.operador_id 
      AND operadores.user_id = auth.uid()
    )
  );

-- Admins e gestores podem ver todas as localizações
CREATE POLICY "Admins e gestores podem ver todas as localizações" ON operador_localizacoes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'gestor_empreendimento')
  );

-- Operadores podem ver apenas suas próprias localizações
CREATE POLICY "Operadores podem ver suas localizações" ON operador_localizacoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operadores 
      WHERE operadores.id = operador_localizacoes.operador_id 
      AND operadores.user_id = auth.uid()
    )
  );

-- View para última localização de cada operador
CREATE OR REPLACE VIEW operadores_ultima_localizacao AS
SELECT DISTINCT ON (ol.operador_id)
  ol.id,
  ol.operador_id,
  o.nome AS operador_nome,
  o.email AS operador_email,
  o.status AS operador_status,
  ol.latitude,
  ol.longitude,
  ol.precisao,
  ol.timestamp,
  ol.bateria_nivel,
  ol.em_movimento,
  ol.velocidade,
  EXTRACT(EPOCH FROM (NOW() - ol.timestamp)) AS segundos_desde_atualizacao
FROM operador_localizacoes ol
INNER JOIN operadores o ON o.id = ol.operador_id
WHERE o.status = 'ativo'
ORDER BY ol.operador_id, ol.timestamp DESC;

-- Adicionar nova permissão ao enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'app_permission' AND e.enumlabel = 'view_rastreamento_operadores') THEN
    ALTER TYPE app_permission ADD VALUE 'view_rastreamento_operadores';
  END IF;
END $$;