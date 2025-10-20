-- Passo 1: Atribuir role admin para rafael@agasen.com.br
INSERT INTO public.user_roles (user_id, role) 
VALUES ('e4aa6dc7-07eb-4eb6-9b0b-4f198de00ade', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Passo 2: Corrigir políticas RLS de user_roles
DROP POLICY IF EXISTS "Allow authenticated users to manage their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow service role to manage all roles" ON public.user_roles;

CREATE POLICY "Admins and managers can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'manage_operadores'::app_permission)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'manage_operadores'::app_permission)
);

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Passo 3: Corrigir políticas RLS de user_permissions
DROP POLICY IF EXISTS "Allow authenticated users to manage their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Allow service role to manage all permissions" ON public.user_permissions;

CREATE POLICY "Admins and managers can manage all permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'manage_operadores'::app_permission)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'manage_operadores'::app_permission)
);

-- Passo 4: Recriar trigger on_user_role_changed
DROP TRIGGER IF EXISTS on_user_role_changed ON public.user_roles;

CREATE TRIGGER on_user_role_changed
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_role_assignment();