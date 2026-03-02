

## Problema confirmado

A migration anterior para corrigir a RLS **não foi salva/aplicada**. A política restritiva original ainda está ativa:

```sql
CREATE POLICY "Operadores podem ver suas rotas"
  ON public.rotas_leitura FOR SELECT
  USING (operador_id IN (SELECT id FROM operadores WHERE user_id = auth.uid()));
```

Isso faz com que Lucas Paulo só veja os registros onde ele é o operador designado. Os empreendimentos atribuídos a Paulo Vitor e Lucas Guilherme aparecem como "Sem operador atribuído".

## Solução

Criar uma nova migration SQL que substitui a política restritiva por uma aberta a todos os autenticados:

```sql
DROP POLICY IF EXISTS "Operadores podem ver suas rotas" ON public.rotas_leitura;

CREATE POLICY "Operadores podem ver todas as rotas"
  ON public.rotas_leitura FOR SELECT
  TO authenticated
  USING (true);
```

- Risco baixo: os dados são apenas atribuições (operador + empreendimento + data + status)
- Admins e gestores já possuem política própria de SELECT sem restrição
- Nenhuma alteração no frontend necessária

