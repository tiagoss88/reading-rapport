-- Adicionar política RLS para permitir que usuários de empreendimento vejam leituras do seu empreendimento
CREATE POLICY "Empreendimento users can view leituras from their empreendimento" 
ON public.leituras 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM empreendimento_users eu
    JOIN clientes c ON c.empreendimento_id = eu.empreendimento_id
    WHERE eu.user_id = auth.uid() 
    AND c.id = leituras.cliente_id
  )
);