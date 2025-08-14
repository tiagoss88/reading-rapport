-- Criar tabela para armazenar os serviços agendados
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_servico TEXT NOT NULL,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  data_agendamento DATE NOT NULL,
  hora_agendamento TIME NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  operador_responsavel_id UUID REFERENCES public.operadores(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view servicos" 
ON public.servicos 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create servicos" 
ON public.servicos 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update servicos" 
ON public.servicos 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete servicos" 
ON public.servicos 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON public.servicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();