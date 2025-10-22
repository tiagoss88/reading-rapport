-- Adicionar nova permissão à tabela permissions
INSERT INTO public.permissions (name, description) VALUES 
  ('view_relatorios', 'Visualizar e gerar relatórios do sistema')
ON CONFLICT (name) DO NOTHING;

-- Adicionar permissão ao admin atual do sistema
INSERT INTO public.user_permissions (user_id, permission)
SELECT 'ac274a2c-b961-4c9d-b228-15cc48c10675', 'view_relatorios'::app_permission
WHERE EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'ac274a2c-b961-4c9d-b228-15cc48c10675' 
  AND role = 'admin'
)
ON CONFLICT DO NOTHING;