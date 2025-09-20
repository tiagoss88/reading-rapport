-- Create table for external services (clients not registered in the system)
CREATE TABLE public.servicos_externos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT NOT NULL,
  endereco_servico TEXT NOT NULL,
  tipo_servico TEXT NOT NULL,
  data_agendamento DATE NOT NULL,
  hora_agendamento TIME,
  operador_responsavel_id UUID,
  status TEXT NOT NULL DEFAULT 'agendado'::text,
  observacoes TEXT,
  descricao_servico_realizado TEXT,
  materiais_utilizados TEXT,
  observacoes_execucao TEXT,
  fotos_servico TEXT[],
  data_execucao TIMESTAMP WITH TIME ZONE,
  hora_inicio TIME,
  hora_fim TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.servicos_externos ENABLE ROW LEVEL SECURITY;

-- Create policies for servicos_externos
CREATE POLICY "Authenticated users can view servicos_externos" 
ON public.servicos_externos 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create servicos_externos" 
ON public.servicos_externos 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update servicos_externos" 
ON public.servicos_externos 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete servicos_externos" 
ON public.servicos_externos 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_servicos_externos_updated_at
BEFORE UPDATE ON public.servicos_externos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();