

## Problema identificado

A política RLS (Row Level Security) na tabela `rotas_leitura` restringe operadores a verem **apenas seus próprios registros**:

```sql
CREATE POLICY "Operadores podem ver suas rotas"
  ON public.rotas_leitura FOR SELECT
  USING (operador_id IN (SELECT id FROM operadores WHERE user_id = auth.uid()));
```

Por isso, quando Paulo Vitor acessa o Cronograma, ele só vê os empreendimentos atribuídos a ele. Os outros aparecem como "Sem operador atribuído" porque os registros de outros operadores são invisíveis pela RLS.

## Solução

Alterar a política RLS para permitir que **qualquer operador autenticado** possa **visualizar** todas as rotas de leitura (SELECT), mantendo as restrições de escrita apenas para admins/gestores. Isso é seguro porque os dados de rotas de leitura não contêm informações sensíveis — apenas atribuições de operador a empreendimento/data.

### Migration SQL

```sql
DROP POLICY "Operadores podem ver suas rotas" ON public.rotas_leitura;

CREATE POLICY "Operadores podem ver todas as rotas"
  ON public.rotas_leitura FOR SELECT
  TO authenticated
  USING (true);
```

### Detalhes técnicos
- **Arquivo**: Nova migration SQL no Supabase
- **Risco**: Baixo. Os dados expostos são apenas atribuições (operador + empreendimento + data + status). Admins e gestores já veem tudo.
- **Nenhuma alteração no frontend** — o código do `ColetorCronograma.tsx` já busca todas as rotas, mas a RLS filtrava os resultados.

