CREATE OR REPLACE FUNCTION public.ng_norm(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    lower(translate(coalesce(t, ''),
      'áàâãäéèêëíìîïóòôõöúùûüÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜçÇñÑ',
      'aaaaaeeeeiiiiooooouuuuAAAAAEEEEIIIIOOOOOUUUUcCnN')),
    '[^a-z0-9]', '', 'g')
$$;

CREATE OR REPLACE FUNCTION public.ng_norm_condo(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT public.ng_norm(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(translate(coalesce(t, ''),
            'áàâãäéèêëíìîïóòôõöúùûüÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜçÇñÑ',
            'aaaaaeeeeiiiiooooouuuuAAAAAEEEEIIIIOOOOOUUUUcCnN')),
          '\([^)]*\)', ' ', 'g'),
        '^\s*ba\s+', ' '),
      '\y(condominio|cond|residencial|resid|edificio|ed)\y', ' ', 'g')
  )
$$;

CREATE OR REPLACE FUNCTION public.ng_norm_unidade(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.ng_norm(t) IN ('unico', 'u') THEN ''
    ELSE regexp_replace(public.ng_norm(t), '^0+', '')
  END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_servico_ng_aberto
ON public.servicos_nacional_gas (
  public.ng_norm(uf),
  public.ng_norm_condo(condominio_nome_original),
  public.ng_norm_unidade(bloco),
  public.ng_norm_unidade(apartamento),
  public.ng_norm(morador_nome),
  public.ng_norm(tipo_servico)
)
WHERE status_atendimento IN ('pendente', 'agendado');