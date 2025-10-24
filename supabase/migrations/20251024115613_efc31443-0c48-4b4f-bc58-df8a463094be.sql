-- Criar tabela tipos_servico
CREATE TABLE public.tipos_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  preco_padrao NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca por nome
CREATE INDEX idx_tipos_servico_nome ON public.tipos_servico(nome);

-- RLS Policies
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;

-- Admins e gestores podem ver todos os tipos
CREATE POLICY "Admins e gestores podem ver tipos de serviço"
  ON public.tipos_servico FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_permission(auth.uid(), 'manage_operadores') OR
    has_permission(auth.uid(), 'create_servicos')
  );

-- Apenas admins e gestores podem criar/editar/deletar
CREATE POLICY "Admins podem gerenciar tipos de serviço"
  ON public.tipos_servico FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_permission(auth.uid(), 'manage_operadores')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_permission(auth.uid(), 'manage_operadores')
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tipos_servico_updated_at
  BEFORE UPDATE ON public.tipos_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir tipos de serviço padrão
INSERT INTO public.tipos_servico (nome, preco_padrao, descricao) VALUES
  ('Instalação', 150.00, 'Instalação de novo medidor'),
  ('Manutenção', 80.00, 'Manutenção preventiva ou corretiva'),
  ('Vistoria', 50.00, 'Vistoria técnica do sistema'),
  ('Troca de Medidor', 120.00, 'Substituição de medidor danificado'),
  ('Leitura Extra', 30.00, 'Leitura fora do período regular');

-- Adicionar coluna preco_servico em servicos
ALTER TABLE public.servicos
ADD COLUMN preco_servico NUMERIC(10, 2);

-- Adicionar coluna preco_servico em servicos_externos
ALTER TABLE public.servicos_externos
ADD COLUMN preco_servico NUMERIC(10, 2);