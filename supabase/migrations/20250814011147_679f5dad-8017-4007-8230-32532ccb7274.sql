-- Allow authenticated users to delete operadores
CREATE POLICY "Authenticated users can delete operadores" 
ON public.operadores 
FOR DELETE 
USING (auth.role() = 'authenticated');