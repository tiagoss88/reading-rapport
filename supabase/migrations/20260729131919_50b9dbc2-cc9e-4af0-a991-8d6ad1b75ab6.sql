ALTER TABLE public.servicos_nacional_gas
ADD COLUMN IF NOT EXISTS fotos_urls text[] NOT NULL DEFAULT '{}'::text[];