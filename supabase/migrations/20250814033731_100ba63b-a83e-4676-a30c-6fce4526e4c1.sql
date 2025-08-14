-- Make hora_agendamento nullable in servicos table
ALTER TABLE public.servicos ALTER COLUMN hora_agendamento DROP NOT NULL;