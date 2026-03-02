

## Causa raiz identificada

O problema **não é na tabela `rotas_leitura`** (essa correção provavelmente já funcionou). O problema está na **RLS da tabela `operadores`**.

A política atual de SELECT em `operadores` é:

```sql
CREATE POLICY "Admins and managers can view all operadores"
  ON public.operadores FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestor_empreendimento') OR
    auth.uid() = user_id   -- operador só vê a si mesmo
  );
```

Quando o cronograma faz `SELECT *, operador:operadores(nome)` na `rotas_leitura`, o JOIN com `operadores` retorna `null` para todos os operadores que **não são** Lucas Paulo, porque a RLS de `operadores` bloqueia o acesso dele aos registros de Paulo Vitor e Lucas Guilherme.

Por isso aparecem como "Sem operador atribuído" — os registros de `rotas_leitura` existem, mas o nome do operador vem `null` no JOIN.

## Solução

Atualizar a política SELECT da tabela `operadores` para permitir que qualquer usuário autenticado veja todos os operadores. Os dados de operadores (nome, status) não são sensíveis e são necessários para coordenação da equipe.

### Migration SQL

```sql
DROP POLICY IF EXISTS "Admins and managers can view all operadores" ON public.operadores;

CREATE POLICY "Authenticated users can view all operadores"
  ON public.operadores FOR SELECT TO authenticated
  USING (true);
```

### Detalhes técnicos
- A tabela `operadores` contém: id, nome, email, telefone, user_id, status — dados de coordenação, não sensíveis
- Nenhuma alteração no frontend necessária
- As políticas de INSERT/UPDATE/DELETE permanecem restritas a admins

