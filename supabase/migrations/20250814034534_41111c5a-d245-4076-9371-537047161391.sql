-- Permitir que o administrador tiago@agasen.com.br veja todos os operadores
-- Primeiro, remover a política restritiva atual
DROP POLICY IF EXISTS "Users can view their own operador profile" ON public.operadores;

-- Criar nova política que permite ao admin ver todos e aos operadores ver apenas o próprio perfil
CREATE POLICY "Admin can view all operadores, operadores can view own profile" 
ON public.operadores 
FOR SELECT 
USING (
  -- Administrador pode ver todos
  auth.email() = 'tiago@agasen.com.br' 
  OR 
  -- Operadores podem ver apenas o próprio perfil
  auth.uid() = user_id
);