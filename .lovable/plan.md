

## Problema: Operadores não conseguem ver rotas planejadas no coletor

### Causa raiz

As politicas RLS (Row Level Security) no Supabase bloqueiam o acesso dos operadores:

- **`dias_uteis`**: Somente `admin` e `gestor_empreendimento` podem fazer SELECT. Operadores retornam array vazio.
- **`rotas_leitura`**: Operadores só veem registros onde `operador_id` corresponde ao seu proprio ID. Se a rota ainda nao foi atribuida a eles, nao aparece.

### Correção

Criar uma migration SQL para adicionar policies de SELECT para operadores:

1. **`dias_uteis`** - Permitir que qualquer usuario autenticado com role de operador (`operador_completo`, `operador_leitura`, `operador_servicos`) possa fazer SELECT em todos os registros de dias_uteis. Dados nao sao sensiveis (apenas UF, data, numero de rota).

2. **`rotas_leitura`** - Permitir que operadores vejam **todas** as rotas de leitura (nao apenas as atribuidas a eles), para que o cronograma mostre o planejamento completo. A policy existente `"Operadores podem ver suas rotas"` filtra por `operador_id`, o que e muito restritivo para a tela de cronograma.

### SQL a ser executado

```sql
-- Operadores podem ver dias_uteis
CREATE POLICY "Operadores podem ver dias uteis"
  ON public.dias_uteis FOR SELECT
  USING (
    has_role(auth.uid(), 'operador_completo') OR
    has_role(auth.uid(), 'operador_leitura') OR
    has_role(auth.uid(), 'operador_servicos')
  );

-- Operadores podem ver todas as rotas de leitura (cronograma)
CREATE POLICY "Operadores podem ver todas rotas leitura"
  ON public.rotas_leitura FOR SELECT
  USING (
    has_role(auth.uid(), 'operador_completo') OR
    has_role(auth.uid(), 'operador_leitura') OR
    has_role(auth.uid(), 'operador_servicos')
  );
```

### Arquivos alterados

- Nova migration SQL em `supabase/migrations/`

### Nenhuma alteracao de codigo

O codigo do `ColetorCronograma.tsx` ja esta correto. O problema e exclusivamente de permissao no banco de dados.

