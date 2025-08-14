-- Adicionar o administrador Tiago como operador também
INSERT INTO public.operadores (
  user_id,
  nome,
  email,
  status
) VALUES (
  'ac274a2c-b961-4c9d-b228-15cc48c10675',
  'Tiago Silva (Admin)',
  'tiago@agasen.com.br',
  'ativo'
);