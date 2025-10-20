-- Add geolocation fields to empreendimentos table
ALTER TABLE public.empreendimentos
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_empreendimentos_location 
ON public.empreendimentos(latitude, longitude);