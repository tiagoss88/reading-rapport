

## Correção: Padronizar tipo_servico em caixa alta

A alteração anterior **não foi aplicada** ao arquivo. A linha 339 de `src/pages/MedicaoTerceirizada/Servicos.tsx` ainda exibe o valor sem transformação.

### Mudança

| Arquivo | Linha | De | Para |
|---|---|---|---|
| `src/pages/MedicaoTerceirizada/Servicos.tsx` | 339 | `{servico.tipo_servico}` | `{servico.tipo_servico?.toUpperCase()}` |

Essa é a única alteração necessária.

