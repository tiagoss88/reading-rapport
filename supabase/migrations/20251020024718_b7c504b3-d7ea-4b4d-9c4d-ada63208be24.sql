-- Fix RLS policies for clientes and empreendimentos tables to restrict public access

-- Drop the overly permissive policy on clientes
DROP POLICY IF EXISTS "Users can view all clientes" ON public.clientes;

-- Create restrictive policy for clientes based on empreendimento access
CREATE POLICY "Users can view clientes from their empreendimentos" ON public.clientes
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'manage_clientes'::app_permission)
  OR EXISTS (
    SELECT 1 FROM public.empreendimento_users
    WHERE empreendimento_users.user_id = auth.uid()
    AND empreendimento_users.empreendimento_id = clientes.empreendimento_id
  )
);

-- Add policy for operadores to view clientes (needed for readings)
CREATE POLICY "Operadores can view clientes for readings" ON public.clientes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.operadores
    WHERE operadores.user_id = auth.uid()
  )
);

-- Drop the overly permissive policy on empreendimentos
DROP POLICY IF EXISTS "Users can view all empreendimentos" ON public.empreendimentos;

-- Create restrictive policy for empreendimentos
CREATE POLICY "Users can view their own empreendimentos" ON public.empreendimentos
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_permission(auth.uid(), 'manage_empreendimentos'::app_permission)
  OR EXISTS (
    SELECT 1 FROM public.empreendimento_users
    WHERE empreendimento_users.user_id = auth.uid()
    AND empreendimento_users.empreendimento_id = empreendimentos.id
  )
);

-- Allow operadores to view empreendimentos (needed for their work)
CREATE POLICY "Operadores can view empreendimentos" ON public.empreendimentos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.operadores
    WHERE operadores.user_id = auth.uid()
  )
);