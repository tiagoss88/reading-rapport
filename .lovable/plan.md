

## Corrigir "Erro ao salvar" — colunas ausentes no banco de produção

### Problema

O app conecta ao banco de produção (`mxoflglqsxupkzrbodkm`) via `vite.config.ts`. As colunas `assinatura_url`, `forma_pagamento`, `valor_servico` e `cpf_cnpj` existem no backend do Lovable Cloud, mas **não existem** no banco de produção. O erro confirma: `Could not find the 'assinatura_url' column`.

### Solução

Você precisa executar o seguinte SQL no **SQL Editor do seu Supabase de produção** (projeto `mxoflglqsxupkzrbodkm`):

```sql
ALTER TABLE public.servicos_nacional_gas
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
ADD COLUMN IF NOT EXISTS valor_servico NUMERIC,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS assinatura_url TEXT;
```

### Como acessar

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto de produção
3. Vá em **SQL Editor** no menu lateral
4. Cole e execute o SQL acima

### Nenhuma alteração de código necessária

O código já está correto. O problema é exclusivamente de estrutura do banco de produção.

