## Objetivo

Alterar a verificação de urgências (PainelUrgencias) para trabalhar em **dias úteis** em vez de **horas úteis**, considerando sábado como dia útil e domingo como não útil.

## Regras de prazo

- **Religação emergencial** → 1 dia útil
- **Religação / Religação automática / Desligamento** → 2 dias úteis
- Contagem a partir da `data_solicitacao`
- Sábado conta como dia útil; domingo não

Exemplo: solicitação em 13/05 (qua) com prazo de 2 dias úteis → vence em 15/05 (sex). Emergencial em 13/05 → vence em 14/05.

## Mudanças no código

Arquivo: `src/components/medicao-terceirizada/PainelUrgencias.tsx`

1. **Substituir `getPrazoHoras` por `getPrazoDias`**
   - `religacao emergencial` / `religacao de emergencia` → 1
   - `religacao` / `religamento` / `desligamento` / `desligacao` → 2
   - demais → `null` (ignorado)

2. **Substituir `calcularHorasUteisRestantes` por `calcularDiasUteisRestantes(dataSolicitacao, prazoDias)`**
   - Calcular `dataLimite` somando `prazoDias` dias úteis (pulando domingos) à data da solicitação (ignorando hora — usar início do dia).
   - Retornar a diferença em dias úteis entre **hoje** (início do dia) e `dataLimite`:
     - `> 0` → ainda no prazo (X dias úteis restantes)
     - `= 0` → vence hoje
     - `< 0` → vencido há N dias úteis
   - Função auxiliar `addDiasUteis(date, n)` e `contarDiasUteisEntre(a, b)` que ignoram domingos.

3. **Atualizar tipo `ServicoUrgente`**: renomear `horasRestantes` → `diasRestantes` e `prazoHoras` → `prazoDias`.

4. **Atualizar `getNivel(diasRestantes, prazoDias)`**:
   - `diasRestantes <= 0` → `vencido`
   - `diasRestantes <= 1` (vence amanhã ou hoje, ainda no prazo) → `critico`
   - resto → `atencao`

5. **Atualizar `formatarTempoRestante(dias, semData)`**:
   - `semData` → "Data não informada"
   - `dias < 0` → "Vencido há N dia(s) útil(eis)"
   - `dias === 0` → "Vence hoje"
   - `dias === 1` → "Vence amanhã"
   - `dias > 1` → "Faltam N dias úteis"

6. **Ordenação** continua por menor `diasRestantes` primeiro.

7. **Texto do card vazio**: trocar "prazos apertados" para refletir dias úteis (texto mantido, só ajuste leve se necessário).

## Sem mudanças

- `Dashboard.tsx` continua usando `getServicosUrgentes` (assinatura externa preservada — apenas o conteúdo dos itens muda; ele só conta níveis).
- Sem mudanças de banco, RLS ou backend.
- Sem mudanças de UI/layout além dos textos de tempo restante.
