

## Remover coluna "Descrição" do Relatório RDO

O usuário quer remover a coluna "Descrição" da tabela do relatório RDO e das exportações, para que o nome do técnico caiba em uma única linha.

### Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/components/relatorios/TabelaRelatorio.tsx` | Remover `<TableHead>Descrição</TableHead>` (linha 38) e `<TableCell>` da descrição (linha 78) |
| `src/components/relatorios/ExportacaoButtons.tsx` | Remover "Descrição" do array `headers` e `item.descricao` do array `rows` no case `rdo_servicos` |
| `src/lib/exportPDF.ts` | Remover "Descrição" das colunas e do mapeamento de dados do RDO |
| `src/lib/exportCSV.ts` | Remover "Descrição" das colunas e do mapeamento de dados do RDO |

São 4 arquivos, todos removendo a sexta coluna (Descrição) do relatório RDO. Nenhuma lógica nova é adicionada.

