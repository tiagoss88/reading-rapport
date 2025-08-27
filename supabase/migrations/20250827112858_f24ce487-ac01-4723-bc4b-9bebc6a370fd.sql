-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS public.has_permission(uuid, app_permission);
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.assign_role_permissions(uuid, app_role);
DROP FUNCTION IF EXISTS public.handle_role_assignment();

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission app_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = _user_id AND permission = _permission
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.assign_role_permissions(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.assign_role_permissions(NEW.user_id, NEW.role);
  RETURN NEW;
END;
$function$;