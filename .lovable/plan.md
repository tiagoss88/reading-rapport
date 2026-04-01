

## Corrigir datas no coletor (fuso horário)

Mesmo problema já corrigido na tabela de Serviços: `new Date("2026-04-01")` é interpretado como UTC meia-noite, que no Brasil (UTC-3) vira 31/03.

### Correção: adicionar `+ 'T00:00:00'` em 3 pontos

**1. `src/pages/ColetorServicosTerceirizados.tsx` (linha 321)**
- Detalhe do serviço: `new Date(selectedServico.data_agendamento + 'T00:00:00')`

**2. `src/pages/ColetorServicos.tsx` (linha 315)**
- Lista de serviços internos: `new Date(servico.data_agendamento + 'T00:00:00')`

**3. `src/pages/ColetorServicos.tsx` (linhas 160-161)**
- Ordenação: `new Date(a.data_agendamento + 'T00:00:00' ...)` e `new Date(b.data_agendamento + 'T00:00:00' ...)`

Correção pontual em 2 arquivos, 4 linhas.

