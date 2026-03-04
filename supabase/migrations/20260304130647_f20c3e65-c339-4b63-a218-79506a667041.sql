-- Core tables: empreendimentos, clientes, operadores, leituras
CREATE TABLE public.empreendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  observacoes TEXT,
  cnpj TEXT,
  email TEXT,
  tipo_gas TEXT CHECK (tipo_gas IN ('GN', 'GLP')),
  fator_conversao DECIMAL(10,4),
  preco_kg_gas DECIMAL(10,2),
  preco_m3_gas DECIMAL(10,2),
  latitude numeric,
  longitude numeric,
  cep TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  identificacao_unidade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  nome TEXT,
  cpf TEXT,
  leitura_inicial NUMERIC NOT NULL DEFAULT 0,
  latitude numeric,
  longitude numeric,
  endereco text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.operadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

CREATE TABLE public.empreendimento_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empreendimento_id),
  UNIQUE(user_id)
);

-- Servicos table
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_servico TEXT NOT NULL,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  data_agendamento DATE NOT NULL,
  hora_agendamento TIME,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  operador_responsavel_id UUID REFERENCES public.operadores(id),
  data_execucao TIMESTAMP WITH TIME ZONE,
  hora_inicio TIME,
  hora_fim TIME,
  descricao_servico_realizado TEXT,
  materiais_utilizados TEXT,
  observacoes_execucao TEXT,
  fotos_servico TEXT[],
  preco_servico NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Servicos externos table
CREATE TABLE public.servicos_externos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT NOT NULL,
  endereco_servico TEXT NOT NULL,
  tipo_servico TEXT NOT NULL,
  data_agendamento DATE NOT NULL,
  hora_agendamento TIME,
  operador_responsavel_id UUID,
  status TEXT NOT NULL DEFAULT 'agendado',
  observacoes TEXT,
  descricao_servico_realizado TEXT,
  materiais_utilizados TEXT,
  observacoes_execucao TEXT,
  fotos_servico TEXT[],
  data_execucao TIMESTAMP WITH TIME ZONE,
  hora_inicio TIME,
  hora_fim TIME,
  preco_servico NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_empreendimentos_updated_at BEFORE UPDATE ON public.empreendimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operadores_updated_at BEFORE UPDATE ON public.operadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leituras_updated_at BEFORE UPDATE ON public.leituras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_empreendimento_users_updated_at BEFORE UPDATE ON public.empreendimento_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON public.servicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_servicos_externos_updated_at BEFORE UPDATE ON public.servicos_externos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_clientes_location ON public.clientes(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_empreendimentos_location ON public.empreendimentos(latitude, longitude);
CREATE INDEX idx_empreendimentos_cep ON public.empreendimentos(cep);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('medidor-fotos', 'medidor-fotos', true);

-- Enable RLS on all tables
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_externos ENABLE ROW LEVEL SECURITY;