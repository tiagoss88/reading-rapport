

## Correção: Padronizar tipo_servico em caixa alta

A linha 339 de `src/pages/MedicaoTerceirizada/Servicos.tsx` ainda exibe `{servico.tipo_servico}` sem transformação.

### Mudança necessária

| Arquivo | Linha | De | Para |
|---|---|---|---|
| `src/pages/MedicaoTerceirizada/Servicos.tsx` | 339 | `<TableCell>{servico.tipo_servico}</TableCell>` | `<TableCell>{servico.tipo_servico?.toUpperCase()}</TableCell>` |

Essa é a única alteração necessária para que "leitura" seja exibido como "LEITURA".

