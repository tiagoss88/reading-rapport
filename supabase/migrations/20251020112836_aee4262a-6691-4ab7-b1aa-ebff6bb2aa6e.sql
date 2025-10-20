-- Adicionar campos de geolocalização à tabela clientes
ALTER TABLE public.clientes
ADD COLUMN latitude numeric,
ADD COLUMN longitude numeric,
ADD COLUMN endereco text,
ADD COLUMN complemento text,
ADD COLUMN bairro text,
ADD COLUMN cidade text,
ADD COLUMN estado text,
ADD COLUMN cep text;

-- Adicionar índice para consultas de geolocalização
CREATE INDEX idx_clientes_location ON public.clientes(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.clientes.latitude IS 'Latitude da localização do cliente';
COMMENT ON COLUMN public.clientes.longitude IS 'Longitude da localização do cliente';
COMMENT ON COLUMN public.clientes.endereco IS 'Endereço completo do cliente';
COMMENT ON COLUMN public.clientes.complemento IS 'Complemento do endereço';
COMMENT ON COLUMN public.clientes.bairro IS 'Bairro do cliente';
COMMENT ON COLUMN public.clientes.cidade IS 'Cidade do cliente';
COMMENT ON COLUMN public.clientes.estado IS 'Estado (UF) do cliente';
COMMENT ON COLUMN public.clientes.cep IS 'CEP do cliente';