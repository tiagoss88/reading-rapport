## Objetivo

Ocultar também os serviços com `status_atendimento = 'cancelado'` na visão **Serviços / Agenda**.

## Mudança

Em `src/components/medicao-terceirizada/AgendaSemanal.tsx`, no `useMemo` `filtered` (linha ~100), adicionar uma linha após o filtro de "executado":

```ts
// Ocultar serviços já executados ou cancelados
if (s.status_atendimento === 'executado') return false
if (s.status_atendimento === 'cancelado') return false
```

## Efeito

- Agenda passa a mostrar apenas serviços ativos (pendente, agendado, em andamento), sem leituras, executados ou cancelados.
- Demais telas (lista de Serviços, relatórios) permanecem inalteradas.