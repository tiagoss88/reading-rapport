

## Correção: Coletas Confirmadas no Dashboard

### Problema

No arquivo `src/pages/Dashboard.tsx` (linha 34), a query de contagem de coletas confirmadas filtra pela coluna errada:

```typescript
.eq('status', 'executado')  // coluna 'status' NÃO EXISTE
```

A coluna correta na tabela `servicos_nacional_gas` é `status_atendimento`. Como a coluna `status` não existe, a query retorna 0 resultados silenciosamente.

### Correção

**Arquivo: `src/pages/Dashboard.tsx`, linha 34**

Substituir:
```typescript
.eq('status', 'executado')
```

Por:
```typescript
.eq('status_atendimento', 'executado')
```

Adicionalmente, remover o cast `as any` que estava mascarando o erro de tipo:
```typescript
const coletasRes = await supabase
  .from('servicos_nacional_gas')
  .select('id', { count: 'exact', head: true })
  .eq('status_atendimento', 'executado')
```

Alteracao de uma unica linha. O contador passara a mostrar o valor real de coletas executadas.

