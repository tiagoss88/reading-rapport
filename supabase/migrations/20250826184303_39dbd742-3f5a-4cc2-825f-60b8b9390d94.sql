-- Create enum for app permissions
CREATE TYPE public.app_permission AS ENUM (
  'view_dashboard',
  'manage_empreendimentos', 
  'manage_clientes',
  'view_leituras',
  'create_leituras',
  'manage_operadores',
  'create_servicos',
  'manage_agendamentos',
  'coletor_leituras',
  'coletor_servicos',
  'view_agendamentos'
);

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'gestor_empreendimento',
  'operador_completo',
  'operador_leitura',
  'operador_servicos'
);

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name app_permission NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create user_permissions table  
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission app_permission NOT NULL,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions
CREATE POLICY "Everyone can view permissions" ON public.permissions FOR SELECT USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles 
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions 
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Insert default permissions
INSERT INTO public.permissions (name, description) VALUES
('view_dashboard', 'Visualizar dashboard principal'),
('manage_empreendimentos', 'Gerenciar empreendimentos'),
('manage_clientes', 'Gerenciar clientes'),
('view_leituras', 'Visualizar leituras'),
('create_leituras', 'Criar novas leituras'),
('manage_operadores', 'Gerenciar operadores'),
('create_servicos', 'Criar serviços'),
('manage_agendamentos', 'Gerenciar agendamentos'),
('coletor_leituras', 'Acesso ao coletor de leituras'),
('coletor_servicos', 'Acesso ao coletor de serviços'),
('view_agendamentos', 'Visualizar agendamentos');

-- Security definer function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission app_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = _user_id AND permission = _permission
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Function to assign default permissions based on role
CREATE OR REPLACE FUNCTION public.assign_role_permissions(_user_id UUID, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing permissions for this user
  DELETE FROM public.user_permissions WHERE user_id = _user_id;
  
  -- Assign permissions based on role
  CASE _role
    WHEN 'admin' THEN
      -- Admin gets all permissions (handled by has_permission function)
      NULL;
    WHEN 'gestor_empreendimento' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES
        (_user_id, 'view_dashboard'),
        (_user_id, 'manage_clientes'),
        (_user_id, 'view_leituras'),
        (_user_id, 'create_servicos'),
        (_user_id, 'manage_agendamentos'),
        (_user_id, 'view_agendamentos');
    WHEN 'operador_completo' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES
        (_user_id, 'coletor_leituras'),
        (_user_id, 'coletor_servicos'),
        (_user_id, 'view_leituras'),
        (_user_id, 'view_agendamentos');
    WHEN 'operador_leitura' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES
        (_user_id, 'coletor_leituras'),
        (_user_id, 'view_leituras');
    WHEN 'operador_servicos' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES
        (_user_id, 'coletor_servicos'),
        (_user_id, 'view_agendamentos');
  END CASE;
END;
$$;

-- Trigger function to assign permissions when role is added
CREATE OR REPLACE FUNCTION public.handle_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.assign_role_permissions(NEW.user_id, NEW.role);
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign permissions when role is created/updated
CREATE TRIGGER on_user_role_changed
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_role_assignment();

-- Add updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();