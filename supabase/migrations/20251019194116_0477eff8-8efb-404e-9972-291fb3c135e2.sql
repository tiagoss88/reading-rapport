-- Inserir na tabela permissions
INSERT INTO permissions (name, description) 
VALUES ('view_rastreamento_operadores', 'Visualizar rastreamento de operadores em tempo real')
ON CONFLICT DO NOTHING;