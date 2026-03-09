

## Problema: Datas aparecendo 1 dia antes

### Causa raiz

`new Date("2026-03-06")` interpreta a string como **UTC meia-noite**. No fuso do Brasil (UTC-3), isso vira `2026-03-05 21:00`, e o `format()` do date-fns mostra **05/03** em vez de 06/03.

Isso afeta **todas** as colunas de data no sistema que usam `new Date(dateString)` com datas no formato `yyyy-MM-dd`.

### Correção

**Arquivo:** `src/pages/MedicaoTerceirizada/Servicos.tsx`

Adicionar `+ 'T00:00:00'` às strings de data antes de criar o `Date`, forçando interpretação como hora local:

- **Linha 349** (data_solicitacao): `new Date(servico.data_solicitacao + 'T00:00:00')`
- **Linha ~375** (data_agendamento): `new Date(servico.data_agendamento + 'T00:00:00')`

Isso garante que `"2026-03-06"` seja interpretado como **06/03/2026 00:00 hora local**, exibindo a data correta.

### Impacto

Correção pontual em 2 linhas. Sem efeitos colaterais.

