
## Problema identificado no Painel de Urgências

### Causa raiz

Na função `getServicosUrgentes` do arquivo `src/components/medicao-terceirizada/PainelUrgencias.tsx`, há um filtro na linha 172 que descarta serviços com mais da metade do prazo restante:

```typescript
// Linha 172 — filtro restritivo que elimina serviços "folgados"
if (horasRestantes <= prazoHoras / 2) {
  urgentes.push(...)
}
```

Para uma **Religação de 48h**, isso significa que o serviço só aparece quando restar **menos de 24 horas úteis**. Se o serviço foi solicitado recentemente e ainda tem mais de 24h úteis disponíveis, ele é silenciosamente ignorado mesmo sendo um serviço de prazo monitorado.

### Solução

Remover o filtro de "metade do prazo" e incluir **todos os serviços de Religação/Desligamento pendentes ou agendados** na lista, usando apenas o nível de urgência para classificá-los visualmente.

A lógica de `getNivel` precisa de um ajuste para cobrir o caso em que o serviço está dentro do prazo e ainda folgado — atualmente retorna `'atencao'` como fallback, o que é adequado para esse caso.

### Arquivo a editar

**`src/components/medicao-terceirizada/PainelUrgencias.tsx`** — função `getServicosUrgentes`:

```typescript
// ANTES (só inclui se restam menos de 50% do prazo):
const horasRestantes = calcularHorasUteisRestantes(...)
const nivel = getNivel(horasRestantes, prazoHoras)

if (horasRestantes <= prazoHoras / 2) {
  urgentes.push({ servico, horasRestantes, nivel, prazoHoras, semData: false })
}

// DEPOIS (inclui todos os pendentes/agendados com prazo monitorado):
const horasRestantes = calcularHorasUteisRestantes(...)
const nivel = getNivel(horasRestantes, prazoHoras)

// Inclui sempre — o badge de nível informa a criticidade
urgentes.push({ servico, horasRestantes, nivel, prazoHoras, semData: false })
```

### Comportamento visual resultante

| Tempo restante | Badge exibido |
|---|---|
| Vencido (≤ 0h) | 🔴 Vencido |
| Crítico (≤ 8h úteis) | 🟠 Crítico |
| Atenção (qualquer outro) | 🟡 Atenção |

Todos os serviços de Religação e Desligamento com status `pendente` ou `agendado` aparecerão no painel, classificados do mais urgente ao mais folgado.

### Único arquivo a editar

| Arquivo | Mudança |
|---|---|
| `src/components/medicao-terceirizada/PainelUrgencias.tsx` | Remover o condicional `if (horasRestantes <= prazoHoras / 2)` e sempre fazer o push |
