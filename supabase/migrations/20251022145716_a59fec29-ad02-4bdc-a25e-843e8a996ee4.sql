-- Add missing permission to the permissions table
INSERT INTO public.permissions (name, description)
VALUES (
  'create_servicos_externos',
  'Permite criar serviços externos (fora de empreendimentos)'
)
ON CONFLICT (name) DO NOTHING;