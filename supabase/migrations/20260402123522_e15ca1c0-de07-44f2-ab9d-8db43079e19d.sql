ALTER TABLE public.servicos_nacional_gas
  ADD COLUMN forma_pagamento text,
  ADD COLUMN valor_servico numeric,
  ADD COLUMN cpf_cnpj text,
  ADD COLUMN assinatura_url text;