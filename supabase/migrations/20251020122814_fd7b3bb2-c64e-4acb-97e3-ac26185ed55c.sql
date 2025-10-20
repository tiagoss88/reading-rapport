-- Public RPC to list empreendimentos without requiring user login
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
SET search_path = public
AS $$
  SELECT e.id, e.nome, e.endereco, e.latitude, e.longitude
  FROM public.empreendimentos e
  WHERE e.nome IS NOT NULL AND e.endereco IS NOT NULL;
$$;

-- Ensure anon and authenticated can execute this function
GRANT EXECUTE ON FUNCTION public.get_public_empreendimentos() TO anon, authenticated;