-- Atualizar URLs antigas no banco de dados (converter signed URLs para public URLs)
-- As signed URLs têm formato: https://PROJECT.supabase.co/storage/v1/object/sign/medidor-fotos/PATH?token=...
-- As public URLs têm formato: https://PROJECT.supabase.co/storage/v1/object/public/medidor-fotos/PATH

-- Atualizar URLs na tabela leituras
UPDATE leituras
SET foto_url = REPLACE(
  SPLIT_PART(foto_url, '?', 1),
  '/storage/v1/object/sign/',
  '/storage/v1/object/public/'
)
WHERE foto_url IS NOT NULL 
  AND foto_url LIKE '%/storage/v1/object/sign/%';

-- Atualizar URLs na tabela servicos
UPDATE servicos
SET fotos_servico = ARRAY(
  SELECT REPLACE(
    SPLIT_PART(unnest(fotos_servico), '?', 1),
    '/storage/v1/object/sign/',
    '/storage/v1/object/public/'
  )
)
WHERE fotos_servico IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM unnest(fotos_servico) AS url 
    WHERE url LIKE '%/storage/v1/object/sign/%'
  );

-- Atualizar URLs na tabela servicos_externos
UPDATE servicos_externos
SET fotos_servico = ARRAY(
  SELECT REPLACE(
    SPLIT_PART(unnest(fotos_servico), '?', 1),
    '/storage/v1/object/sign/',
    '/storage/v1/object/public/'
  )
)
WHERE fotos_servico IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM unnest(fotos_servico) AS url 
    WHERE url LIKE '%/storage/v1/object/sign/%'
  );