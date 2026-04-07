
-- Add column
ALTER TABLE public.servicos_nacional_gas
ADD COLUMN IF NOT EXISTS numero_protocolo TEXT UNIQUE;

-- Backfill existing records
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM public.servicos_nacional_gas
)
UPDATE public.servicos_nacional_gas s
SET numero_protocolo = 'NG-' || LPAD(n.rn::TEXT, 6, '0')
FROM numbered n
WHERE s.id = n.id AND s.numero_protocolo IS NULL;

-- Function to generate next protocol
CREATE OR REPLACE FUNCTION public.generate_protocolo_ng()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_protocolo FROM 4) AS INT)), 0) + 1
  INTO next_num FROM public.servicos_nacional_gas WHERE numero_protocolo IS NOT NULL;
  NEW.numero_protocolo := 'NG-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER trg_protocolo_ng
BEFORE INSERT ON public.servicos_nacional_gas
FOR EACH ROW WHEN (NEW.numero_protocolo IS NULL)
EXECUTE FUNCTION public.generate_protocolo_ng();
