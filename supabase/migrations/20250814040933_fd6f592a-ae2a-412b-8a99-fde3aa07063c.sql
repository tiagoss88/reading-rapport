-- Add leitura_inicial column to clientes table
ALTER TABLE public.clientes 
ADD COLUMN leitura_inicial NUMERIC NOT NULL DEFAULT 0;