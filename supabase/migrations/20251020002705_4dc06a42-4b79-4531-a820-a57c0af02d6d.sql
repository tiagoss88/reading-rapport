-- Fix operadores RLS policy to use role-based access instead of hardcoded email
DROP POLICY IF EXISTS "Admin can view all operadores, operadores can view own profile" ON public.operadores;

CREATE POLICY "Admins and managers can view all operadores" ON public.operadores
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'gestor_empreendimento'::app_role) OR
  auth.uid() = user_id
);

-- Strengthen servicos RLS policies with permission checks
DROP POLICY IF EXISTS "Authenticated users can view servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can create servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can update servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can delete servicos" ON public.servicos;

CREATE POLICY "Users with create_servicos permission can create" ON public.servicos
FOR INSERT TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'create_servicos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view servicos from their empreendimentos" ON public.servicos
FOR SELECT TO authenticated
USING (
  has_permission(auth.uid(), 'view_agendamentos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.empreendimento_users
    WHERE empreendimento_users.user_id = auth.uid()
    AND empreendimento_users.empreendimento_id = servicos.empreendimento_id
  )
);

CREATE POLICY "Authorized users can update servicos" ON public.servicos
FOR UPDATE TO authenticated
USING (
  has_permission(auth.uid(), 'manage_agendamentos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  operador_responsavel_id IN (SELECT id FROM operadores WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete servicos" ON public.servicos
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_permission(auth.uid(), 'manage_agendamentos'::app_permission)
);

-- Strengthen servicos_externos RLS policies
DROP POLICY IF EXISTS "Authenticated users can view servicos_externos" ON public.servicos_externos;
DROP POLICY IF EXISTS "Authenticated users can create servicos_externos" ON public.servicos_externos;
DROP POLICY IF EXISTS "Authenticated users can update servicos_externos" ON public.servicos_externos;
DROP POLICY IF EXISTS "Authenticated users can delete servicos_externos" ON public.servicos_externos;

CREATE POLICY "Users with permission can create servicos_externos" ON public.servicos_externos
FOR INSERT TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'create_servicos_externos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users with permission can view servicos_externos" ON public.servicos_externos
FOR SELECT TO authenticated
USING (
  has_permission(auth.uid(), 'view_agendamentos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authorized users can update servicos_externos" ON public.servicos_externos
FOR UPDATE TO authenticated
USING (
  has_permission(auth.uid(), 'manage_agendamentos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  operador_responsavel_id IN (SELECT id FROM operadores WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete servicos_externos" ON public.servicos_externos
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_permission(auth.uid(), 'manage_agendamentos'::app_permission)
);

-- Strengthen empreendimentos RLS policies
DROP POLICY IF EXISTS "Authenticated users can create empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Authenticated users can update empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Authenticated users can delete empreendimentos" ON public.empreendimentos;

CREATE POLICY "Admins can create empreendimentos" ON public.empreendimentos
FOR INSERT TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'manage_empreendimentos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authorized users can update empreendimentos" ON public.empreendimentos
FOR UPDATE TO authenticated
USING (
  has_permission(auth.uid(), 'manage_empreendimentos'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete empreendimentos" ON public.empreendimentos
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Strengthen clientes RLS policies
DROP POLICY IF EXISTS "Authenticated users can create clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON public.clientes;

CREATE POLICY "Users with permission can create clientes" ON public.clientes
FOR INSERT TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'manage_clientes'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authorized users can update clientes" ON public.clientes
FOR UPDATE TO authenticated
USING (
  has_permission(auth.uid(), 'manage_clientes'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authorized users can delete clientes" ON public.clientes
FOR DELETE TO authenticated
USING (
  has_permission(auth.uid(), 'manage_clientes'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Strengthen operadores INSERT policy
DROP POLICY IF EXISTS "Users can create their own operador profile" ON public.operadores;

CREATE POLICY "Service role can create operadores" ON public.operadores
FOR INSERT TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'manage_operadores'::app_permission) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add storage policies for medidor-fotos bucket to prepare for private access
CREATE POLICY "Authenticated users can upload to medidor-fotos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medidor-fotos');

CREATE POLICY "Authenticated users can view medidor-fotos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'medidor-fotos');

CREATE POLICY "Authenticated users can update medidor-fotos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'medidor-fotos');

CREATE POLICY "Authenticated users can delete medidor-fotos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'medidor-fotos');