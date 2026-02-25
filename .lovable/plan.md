

## Diagnóstico: Rota 18 CE aparece como "Não planejado"

### Causa raiz

O bug esta na construção da data final da query de `rotas_leitura`. Tanto em `PlanejamentoRotas.tsx` quanto em `ColetorCronograma.tsx`, o codigo usa:

```typescript
const endDate = `${ano}-${mes.padStart(2, '0')}-31`
```

Isso gera datas invalidas como `2026-02-31` (fevereiro nao tem 31 dias). O Supabase/PostgreSQL retorna erro 400:

```json
{"code":"22008","message":"date/time field value out of range: \"2026-02-31\""}
```

Como a query falha, `rotasLeitura` fica `undefined`, e o sistema interpreta todas as rotas como "Nao planejado" -- mesmo que existam registros de `rotas_leitura` com operadores atribuidos para aquela data.

Os dados estao corretos no banco (a query por data exata `eq.2026-02-25` retorna os 7 empreendimentos com operadores). O problema e exclusivamente na query de listagem mensal.

### Correcao

Calcular o ultimo dia do mes corretamente usando `date-fns`, em vez de assumir dia 31.

**Arquivos afetados:**

1. **`src/pages/MedicaoTerceirizada/PlanejamentoRotas.tsx`** (linha 79)
2. **`src/pages/ColetorCronograma.tsx`** (linha 67)

Em ambos, substituir:
```typescript
const endDate = `${ano}-${mes.padStart(2, '0')}-31`
```

Por:
```typescript
import { lastDayOfMonth, format } from 'date-fns'

const endDate = format(
  lastDayOfMonth(new Date(parseInt(ano), parseInt(mes) - 1)),
  'yyyy-MM-dd'
)
```

Isso garante que fevereiro use dia 28 (ou 29 em anos bissextos), abril use 30, etc.

