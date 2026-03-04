-- Add missing competencia column to leituras
ALTER TABLE public.leituras ADD COLUMN competencia TEXT;

-- Add missing RLS policies for core tables
-- Empreendimentos
CREATE POLICY "Users can view their own empreendimentos" ON public.empreendimentos FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_empreendimentos'::app_permission)
  OR EXISTS (SELECT 1 FROM public.empreendimento_users WHERE empreendimento_users.user_id = auth.uid() AND empreendimento_users.empreendimento_id = empreendimentos.id));

CREATE POLICY "Operadores can view empreendimentos" ON public.empreendimentos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.operadores WHERE operadores.user_id = auth.uid()));

CREATE POLICY "Admins can create empreendimentos" ON public.empreendimentos FOR INSERT TO authenticated
WITH CHECK (has_permission(auth.uid(), 'manage_empreendimentos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authorized users can update empreendimentos" ON public.empreendimentos FOR UPDATE TO authenticated
USING (has_permission(auth.uid(), 'manage_empreendimentos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete empreendimentos" ON public.empreendimentos FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clientes
CREATE POLICY "Users can view clientes from their empreendimentos" ON public.clientes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_clientes'::app_permission)
  OR EXISTS (SELECT 1 FROM public.empreendimento_users WHERE empreendimento_users.user_id = auth.uid() AND empreendimento_users.empreendimento_id = clientes.empreendimento_id));

CREATE POLICY "Operadores can view clientes for readings" ON public.clientes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.operadores WHERE operadores.user_id = auth.uid()));

CREATE POLICY "Users with permission can create clientes" ON public.clientes FOR INSERT TO authenticated
WITH CHECK (has_permission(auth.uid(), 'manage_clientes'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authorized users can update clientes" ON public.clientes FOR UPDATE TO authenticated
USING (has_permission(auth.uid(), 'manage_clientes'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authorized users can delete clientes" ON public.clientes FOR DELETE TO authenticated
USING (has_permission(auth.uid(), 'manage_clientes'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

-- Operadores
CREATE POLICY "Admins and managers can view all operadores" ON public.operadores FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor_empreendimento'::app_role) OR auth.uid() = user_id);

CREATE POLICY "Service role can create operadores" ON public.operadores FOR INSERT TO authenticated
WITH CHECK (has_permission(auth.uid(), 'manage_operadores'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own operador profile" ON public.operadores FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete operadores" ON public.operadores FOR DELETE USING (auth.role() = 'authenticated');

-- Leituras
CREATE POLICY "Operadores can view their own leituras" ON public.leituras FOR SELECT
USING (EXISTS (SELECT 1 FROM public.operadores WHERE operadores.id = leituras.operador_id AND operadores.user_id = auth.uid()));

CREATE POLICY "Empreendimento users can view leituras" ON public.leituras FOR SELECT
USING (EXISTS (SELECT 1 FROM empreendimento_users eu JOIN clientes c ON c.empreendimento_id = eu.empreendimento_id WHERE eu.user_id = auth.uid() AND c.id = leituras.cliente_id));

CREATE POLICY "Admins can view all leituras" ON public.leituras FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Operadores can create leituras" ON public.leituras FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.operadores WHERE operadores.id = leituras.operador_id AND operadores.user_id = auth.uid()));

CREATE POLICY "Operadores can update their own leituras" ON public.leituras FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.operadores WHERE operadores.id = leituras.operador_id AND operadores.user_id = auth.uid()));

-- Empreendimento users
CREATE POLICY "Auth can view empreendimento_users" ON public.empreendimento_users FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Auth can create empreendimento_users" ON public.empreendimento_users FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Auth can update empreendimento_users" ON public.empreendimento_users FOR UPDATE USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Auth can delete empreendimento_users" ON public.empreendimento_users FOR DELETE USING (auth.role() = 'authenticated'::text);

-- Servicos
CREATE POLICY "Users with create_servicos can create" ON public.servicos FOR INSERT TO authenticated
WITH CHECK (has_permission(auth.uid(), 'create_servicos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view servicos" ON public.servicos FOR SELECT TO authenticated
USING (has_permission(auth.uid(), 'view_agendamentos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.empreendimento_users WHERE empreendimento_users.user_id = auth.uid() AND empreendimento_users.empreendimento_id = servicos.empreendimento_id));

CREATE POLICY "Authorized users can update servicos" ON public.servicos FOR UPDATE TO authenticated
USING (has_permission(auth.uid(), 'manage_agendamentos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role)
  OR operador_responsavel_id IN (SELECT id FROM operadores WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete servicos" ON public.servicos FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_agendamentos'::app_permission));

-- Servicos externos
CREATE POLICY "Users with permission can create servicos_externos" ON public.servicos_externos FOR INSERT TO authenticated
WITH CHECK (has_permission(auth.uid(), 'create_servicos_externos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users with permission can view servicos_externos" ON public.servicos_externos FOR SELECT TO authenticated
USING (has_permission(auth.uid(), 'view_agendamentos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authorized users can update servicos_externos" ON public.servicos_externos FOR UPDATE TO authenticated
USING (has_permission(auth.uid(), 'manage_agendamentos'::app_permission) OR has_role(auth.uid(), 'admin'::app_role)
  OR operador_responsavel_id IN (SELECT id FROM operadores WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete servicos_externos" ON public.servicos_externos FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'manage_agendamentos'::app_permission));

-- Storage policies
CREATE POLICY "Auth upload medidor-fotos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medidor-fotos');
CREATE POLICY "Auth view medidor-fotos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'medidor-fotos');
CREATE POLICY "Public view medidor-fotos" ON storage.objects FOR SELECT USING (bucket_id = 'medidor-fotos');
CREATE POLICY "Auth update medidor-fotos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'medidor-fotos');
CREATE POLICY "Auth delete medidor-fotos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'medidor-fotos');