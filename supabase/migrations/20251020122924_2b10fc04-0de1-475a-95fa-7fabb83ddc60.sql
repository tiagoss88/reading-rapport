-- Fix search_path for get_public_empreendimentos
DROP FUNCTION IF EXISTS public.get_public_empreendimentos();

CREATE OR REPLACE FUNCTION public.get_public_empreendimentos()
RETURNS TABLE (
  id uuid,
  nome text,
  endereco text,
  latitude numeric,
  longitude numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT e.id, e.nome, e.endereco, e.latitude, e.longitude
  FROM public.empreendimentos e
  WHERE e.nome IS NOT NULL AND e.endereco IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_empreendimentos() TO anon, authenticated;