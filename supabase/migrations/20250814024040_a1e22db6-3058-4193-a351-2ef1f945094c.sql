-- Add email field to empreendimentos table
ALTER TABLE public.empreendimentos 
ADD COLUMN email TEXT;

-- Create a table to link empreendimentos to auth users
CREATE TABLE public.empreendimento_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empreendimento_id),
  UNIQUE(user_id)
);

-- Enable RLS on the new table
ALTER TABLE public.empreendimento_users ENABLE ROW LEVEL SECURITY;

-- Create policies for empreendimento_users
CREATE POLICY "Authenticated users can view empreendimento_users"
ON public.empreendimento_users
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create empreendimento_users"
ON public.empreendimento_users
FOR INSERT
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update empreendimento_users"
ON public.empreendimento_users
FOR UPDATE
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete empreendimento_users"
ON public.empreendimento_users
FOR DELETE
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_empreendimento_users_updated_at
BEFORE UPDATE ON public.empreendimento_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();