## Ajuste — 4 níveis de urgência

Em `src/components/medicao-terceirizada/PainelUrgencias.tsx`:

### Nova classificação por dias úteis restantes

| diasRestantes | Nível | Badge | Borda |
|---|---|---|---|
| < 0 | `vencido` | Vencido (vermelho) | vermelha |
| 0 | `critico` | Vence hoje (laranja) | laranja |
| 1 | `atencao` | Atenção (amarelo) | amarela |
| ≥ 2 | `no_prazo` | Dentro do prazo (verde) | verde |

### Mudanças

1. **Tipo `NivelUrgencia`**: adicionar `'no_prazo'`.
2. **`nivelConfig`**: adicionar entrada `no_prazo` com classes verdes (`bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400` e `border-l-green-500`), label "Dentro do prazo".
3. **`getNivel`**:
   ```ts
   if (diasRestantes < 0) return 'vencido'
   if (diasRestantes === 0) return 'critico'
   if (diasRestantes === 1) return 'atencao'
   return 'no_prazo'
   ```
4. **`getServicosUrgentes`**: continua incluindo todos os serviços com prazo aplicável (não filtra mais por urgência).
5. **Cabeçalho do painel** (`PainelUrgencias`): adicionar contagem `no_prazo` (badge verde, opcional, exibida quando > 0). Manter contagens de vencidos e críticos.
6. **Resumo "Copiar"**: adicionar seção `🟢 DENTRO DO PRAZO (N)` com os itens `no_prazo`.
7. **Dashboard.tsx**: nenhuma mudança — só conta `vencido` e `critico` para o card de alerta, comportamento preservado.

### Sem mudanças
- Lógica de cálculo de dias úteis.
- Mensagem `formatarTempoRestante` ("Vence hoje", "Vence amanhã", "Faltam N dias úteis").
