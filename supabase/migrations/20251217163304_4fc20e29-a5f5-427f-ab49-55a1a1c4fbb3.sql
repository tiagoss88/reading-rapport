-- Criar tabela de configurações do sistema
CREATE TABLE public.configuracoes_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave varchar(100) UNIQUE NOT NULL,
  valor text,
  descricao text,
  tipo varchar(50) DEFAULT 'text',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos autenticados podem ler, apenas admins podem modificar
CREATE POLICY "Usuarios autenticados podem ler configuracoes" 
ON public.configuracoes_sistema 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem inserir configuracoes" 
ON public.configuracoes_sistema 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar configuracoes" 
ON public.configuracoes_sistema 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar configuracoes" 
ON public.configuracoes_sistema 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracoes_sistema_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração inicial do Mapbox
INSERT INTO public.configuracoes_sistema (chave, valor, descricao, tipo)
VALUES (
  'mapbox_token',
  NULL,
  'Token público do Mapbox para mapas de georreferenciamento',
  'text'
);