-- Create empreendimentos (condominiums) table
CREATE TABLE public.empreendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clientes (units) table
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  identificacao_unidade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operadores table
CREATE TABLE public.operadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leituras table
CREATE TABLE public.leituras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  operador_id UUID NOT NULL REFERENCES public.operadores(id) ON DELETE RESTRICT,
  leitura_atual NUMERIC NOT NULL,
  foto_url TEXT,
  observacao TEXT,
  tipo_observacao TEXT CHECK (tipo_observacao IN ('acesso_negado', 'medidor_embacado', 'sem_medidor', 'medidor_substituido', 'outro')),
  data_leitura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_sincronizacao TEXT NOT NULL DEFAULT 'sincronizado' CHECK (status_sincronizacao IN ('pendente', 'sincronizado', 'erro')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leituras ENABLE ROW LEVEL SECURITY;

-- Create policies for empreendimentos
CREATE POLICY "Users can view all empreendimentos" 
ON public.empreendimentos 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create empreendimentos" 
ON public.empreendimentos 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update empreendimentos" 
ON public.empreendimentos 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete empreendimentos" 
ON public.empreendimentos 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create policies for clientes
CREATE POLICY "Users can view all clientes" 
ON public.clientes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clientes" 
ON public.clientes 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clientes" 
ON public.clientes 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create policies for operadores
CREATE POLICY "Users can view their own operador profile" 
ON public.operadores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own operador profile" 
ON public.operadores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operador profile" 
ON public.operadores 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for leituras
CREATE POLICY "Operadores can view their own leituras" 
ON public.leituras 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.operadores 
  WHERE operadores.id = leituras.operador_id 
  AND operadores.user_id = auth.uid()
));

CREATE POLICY "Operadores can create leituras" 
ON public.leituras 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.operadores 
  WHERE operadores.id = leituras.operador_id 
  AND operadores.user_id = auth.uid()
));

CREATE POLICY "Operadores can update their own leituras" 
ON public.leituras 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.operadores 
  WHERE operadores.id = leituras.operador_id 
  AND operadores.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_empreendimentos_updated_at
  BEFORE UPDATE ON public.empreendimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operadores_updated_at
  BEFORE UPDATE ON public.operadores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leituras_updated_at
  BEFORE UPDATE ON public.leituras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for meter photos
INSERT INTO storage.buckets (id, name, public) VALUES ('medidor-fotos', 'medidor-fotos', false);

-- Create storage policies
CREATE POLICY "Operadores can upload photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medidor-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Operadores can view photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medidor-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Operadores can update photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medidor-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Operadores can delete photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medidor-fotos' AND auth.role() = 'authenticated');