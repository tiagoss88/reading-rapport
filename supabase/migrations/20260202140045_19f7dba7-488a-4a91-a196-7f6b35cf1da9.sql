-- Permitir operadores verem TODOS os serviços terceirizados
CREATE POLICY "Operadores podem ver todos os servicos"
ON public.servicos_nacional_gas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM operadores 
    WHERE user_id = auth.uid()
  )
);

-- Permitir operadores atualizarem qualquer serviço
CREATE POLICY "Operadores podem atualizar servicos"
ON public.servicos_nacional_gas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM operadores 
    WHERE user_id = auth.uid()
  )
);