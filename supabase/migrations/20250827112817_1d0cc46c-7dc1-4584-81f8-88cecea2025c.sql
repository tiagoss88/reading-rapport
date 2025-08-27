-- Fix RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;

-- Create simplified policies without circular references
CREATE POLICY "Allow all authenticated users to view roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage their own roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Allow service role to manage all roles" 
ON public.user_roles 
FOR ALL 
TO service_role 
USING (true);

CREATE POLICY "Allow all authenticated users to view permissions" 
ON public.user_permissions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage their own permissions" 
ON public.user_permissions 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Allow service role to manage all permissions" 
ON public.user_permissions 
FOR ALL 
TO service_role 
USING (true);

-- Assign admin role to the first user if no admin exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::app_role 
    FROM auth.users 
    WHERE email = 'tiago@agasen.com.br'
    LIMIT 1;
  END IF;
END $$;