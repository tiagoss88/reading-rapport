-- Add gas type and related fields to empreendimentos table
ALTER TABLE public.empreendimentos 
ADD COLUMN tipo_gas TEXT CHECK (tipo_gas IN ('GN', 'GLP')),
ADD COLUMN fator_conversao DECIMAL(10,4),
ADD COLUMN preco_kg_gas DECIMAL(10,2),
ADD COLUMN preco_m3_gas DECIMAL(10,2);

-- Add comments for clarity
COMMENT ON COLUMN public.empreendimentos.tipo_gas IS 'Tipo de gás: GN (Gás Natural) ou GLP (Gás Liquefeito de Petróleo)';
COMMENT ON COLUMN public.empreendimentos.fator_conversao IS 'Fator de conversão para GLP';
COMMENT ON COLUMN public.empreendimentos.preco_kg_gas IS 'Preço por kg do gás (para GLP)';
COMMENT ON COLUMN public.empreendimentos.preco_m3_gas IS 'Preço por m³ do gás (para GN)';