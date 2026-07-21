## Problema

As tabelas `materiais`, `estoque_movimentacoes` e `tipo_servico_materiais` foram criadas, mas ficaram **sem GRANTs** para os roles do Data API. Sem GRANT, o PostgREST devolve "Could not find the table 'public.materiais' in the schema cache".

Verificado: `SELECT ... information_schema.role_table_grants WHERE table_name='materiais'` → 0 linhas.

## Correção

Executar uma migração adicionando os GRANTs corretos + notificar o PostgREST a recarregar o cache:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;
GRANT ALL ON public.materiais TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipo_servico_materiais TO authenticated;
GRANT ALL ON public.tipo_servico_materiais TO service_role;

GRANT SELECT ON public.v_estoque_saldo TO authenticated;
GRANT SELECT ON public.v_estoque_saldo TO service_role;

NOTIFY pgrst, 'reload schema';
```

Sem `anon` porque todas as policies do módulo Estoque exigem `authenticated` (admin/gestor).

Nenhuma alteração de código é necessária — as tabelas e policies já estão corretas.