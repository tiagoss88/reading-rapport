

## Problema

A migration para corrigir a RLS na tabela `rotas_leitura` **nunca foi efetivamente aplicada**. O arquivo `20260302_rotas_leitura_select_all_authenticated.sql` não existe na pasta de migrations.

A política restritiva original continua ativa, impedindo operadores de verem atribuições de outros operadores.

## Solução

Criar a migration SQL com nome no formato correto (timestamp padrão do projeto):

```sql
DROP POLICY IF EXISTS "Operadores podem ver suas rotas" ON public.rotas_leitura;

CREATE POLICY "Operadores podem ver todas as rotas"
  ON public.rotas_leitura FOR SELECT
  TO authenticated
  USING (true);
```

Arquivo: `supabase/migrations/20260302210000_rotas_leitura_open_select.sql`

Nenhuma alteração no frontend necessária.

