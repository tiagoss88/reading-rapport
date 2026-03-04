-- Permissions/roles system
CREATE TYPE public.app_permission AS ENUM (
  'view_dashboard', 'manage_empreendimentos', 'manage_clientes', 'view_leituras',
  'create_leituras', 'manage_operadores', 'create_servicos', 'manage_agendamentos',
  'coletor_leituras', 'coletor_servicos', 'view_agendamentos', 'create_servicos_externos',
  'view_rastreamento_operadores', 'view_relatorios'
);

CREATE TYPE public.app_role AS ENUM (
  'admin', 'gestor_empreendimento', 'operador_completo', 'operador_leitura', 'operador_servicos'
);

CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name app_permission NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission app_permission NOT NULL,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to view permissions" ON public.user_permissions FOR SELECT TO authenticated USING (true);

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission app_permission)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND permission = _permission) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'); $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.assign_role_permissions(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.user_permissions WHERE user_id = _user_id;
  CASE _role
    WHEN 'admin' THEN NULL;
    WHEN 'gestor_empreendimento' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES
        (_user_id, 'view_dashboard'), (_user_id, 'manage_clientes'), (_user_id, 'view_leituras'),
        (_user_id, 'create_servicos'), (_user_id, 'manage_agendamentos'), (_user_id, 'view_agendamentos');
    WHEN 'operador_completo' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES
        (_user_id, 'coletor_leituras'), (_user_id, 'coletor_servicos'), (_user_id, 'view_leituras'), (_user_id, 'view_agendamentos');
    WHEN 'operador_leitura' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES (_user_id, 'coletor_leituras'), (_user_id, 'view_leituras');
    WHEN 'operador_servicos' THEN
      INSERT INTO public.user_permissions (user_id, permission) VALUES (_user_id, 'coletor_servicos'), (_user_id, 'view_agendamentos');
  END CASE;
END; $function$;

CREATE OR REPLACE FUNCTION public.handle_role_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$ BEGIN PERFORM public.assign_role_permissions(NEW.user_id, NEW.role); RETURN NEW; END; $function$;

CREATE TRIGGER on_user_role_changed AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.handle_role_assignment();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for roles/permissions management
CREATE POLICY "Admins and managers can manage all roles" ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_operadores'::app_permission))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_operadores'::app_permission));

CREATE POLICY "Admins and managers can manage all permissions" ON public.user_permissions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_operadores'::app_permission))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_operadores'::app_permission));

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
  ('view_agendamentos', 'Visualizar agendamentos'),
  ('create_servicos_externos', 'Criar serviços externos'),
  ('view_rastreamento_operadores', 'Visualizar rastreamento de operadores em tempo real'),
  ('view_relatorios', 'Visualizar e gerar relatórios do sistema');