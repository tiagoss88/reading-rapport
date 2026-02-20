
## Diagnóstico: Por que o operador Miguel não aparece no rastreamento

### Causa raiz identificada

A view `operadores_ultima_localizacao` foi criada na migration `20251019194038` com a seguinte cláusula:

```sql
WHERE o.status = 'ativo'
```

Se o cadastro do Miguel no banco tiver `status = 'inativo'` ou qualquer outro valor fora de `'ativo'`, ele é silenciosamente excluído da view — mesmo tendo feito login e enviado localizações.

Além disso, a view foi criada **antes** das colunas `endereco_estimado` e `precisao_rating` serem adicionadas à tabela (migration `20251020124720`), portanto essas colunas **nunca são retornadas** pela view — sempre chegam como `null` no frontend.

### Dois problemas a corrigir

**Problema 1 — Operador não aparece (Miguel)**
A view filtra apenas `status = 'ativo'`. O operador Miguel pode ter sido cadastrado com status diferente, ou seu status foi alterado.

**Problema 2 — View desatualizada**
A view não inclui as colunas `endereco_estimado` e `precisao_rating` adicionadas posteriormente.

### Solução: Recriar a view com todas as colunas

Criar uma nova migration que recria a view corretamente, incluindo todas as colunas existentes na tabela. O filtro de status será mantido, mas verificaremos também se o operador está como `'ativo'`.

```sql
CREATE OR REPLACE VIEW operadores_ultima_localizacao AS
SELECT DISTINCT ON (ol.operador_id)
  ol.id,
  ol.operador_id,
  o.nome AS operador_nome,
  o.email AS operador_email,
  o.status AS operador_status,
  ol.latitude,
  ol.longitude,
  ol.precisao,
  ol.timestamp,
  ol.bateria_nivel,
  ol.em_movimento,
  ol.velocidade,
  ol.endereco_estimado,
  ol.precisao_rating,
  EXTRACT(EPOCH FROM (NOW() - ol.timestamp)) AS segundos_desde_atualizacao
FROM operador_localizacoes ol
INNER JOIN operadores o ON o.id = ol.operador_id
WHERE o.status = 'ativo'
ORDER BY ol.operador_id, ol.timestamp DESC;
```

### Ação paralela necessária — verificar o status do Miguel

Antes de publicar a migration, o status do Miguel na tabela `operadores` precisa ser `'ativo'`. Se não estiver, a view continuará ocultando ele mesmo após a correção.

A correção do status pode ser feita na tela de **Operadores** do sistema (editando o cadastro do Miguel), sem necessidade de SQL manual.

### Arquivos a criar/editar

| Ação | Detalhe |
|---|---|
| Nova migration SQL | Recriar a view com `endereco_estimado` e `precisao_rating` |
| Verificação manual | Confirmar que o status do Miguel na tela de Operadores está como "Ativo" |

### Sequência de passos

1. Criar nova migration que redefine a view com todas as colunas
2. Verificar (e corrigir se necessário) o status do Miguel na tela de Operadores
3. O operador precisa abrir o app e aguardar a primeira atualização de localização (até 10 minutos) para que o novo registro apareça
