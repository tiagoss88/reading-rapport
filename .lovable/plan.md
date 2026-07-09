## Problema

A tabela `public.gti_leituras_mensais` foi criada, mas ficou **sem os GRANTs** para as roles do Data API (`authenticated`, `service_role`). Por isso o PostgREST retorna:

> Could not find the table 'public.gti_leituras_mensais' in the schema cache

## Correção (migração única)

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gti_leituras_mensais TO authenticated;
GRANT ALL ON public.gti_leituras_mensais TO service_role;

NOTIFY pgrst, 'reload schema';
```

Sem alterações de RLS, políticas, colunas ou código do frontend — apenas os GRANTs que faltaram na migração original + reload do cache do PostgREST.

Depois disso, a importação da planilha na aba **GTI** volta a funcionar imediatamente.