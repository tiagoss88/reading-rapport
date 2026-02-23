

## Correção: tipo_servico em caixa alta no Relatório RDO

A alteração anterior foi aplicada apenas na tela de **Serviços** (`Servicos.tsx`). O **Relatório** usa componentes diferentes que também exibem `tipo_servico` sem transformação.

### Arquivos a editar

| Arquivo | Linha | De | Para |
|---|---|---|---|
| `src/components/relatorios/TabelaRelatorio.tsx` | 65 | `{item.tipo_servico}` | `{item.tipo_servico?.toUpperCase()}` |
| `src/lib/exportPDF.ts` | 53 | `item.tipo_servico` | `item.tipo_servico?.toUpperCase()` |
| `src/lib/exportCSV.ts` | 23 | `item.tipo_servico` | `item.tipo_servico?.toUpperCase()` |

São 3 pontos onde o tipo de serviço aparece no módulo de relatórios: tabela na tela, exportação PDF e exportação CSV. Todos precisam de `.toUpperCase()`.

