## Objetivo
Permitir que o admin exclua relatórios de leitura listados na aba **Relatório de Leitura** em `/medicao-terceirizada/leituras`.

## Contexto
Cada "relatório" não é uma linha própria no banco — ele está embutido no campo `observacao` da coleta correspondente, no formato:
`... | Fotos relatorio: [url1, url2, ...]`

A aba já filtra coletas que contêm `Fotos relatorio:` no `observacao`. "Excluir o relatório" significa remover apenas esse trecho do `observacao`, **mantendo a coleta/leitura intactas**.

## Mudanças

### `src/pages/MedicaoTerceirizada/Leituras.tsx`
1. Importar `usePermissions` (`isAdmin`) e o ícone `Trash2`.
2. Adicionar nova coluna **"Ações"** na tabela da aba Relatório de Leitura, visível apenas quando `isAdmin === true`.
3. Por linha, um botão lixeira (vermelho, `variant="ghost" size="icon"`) que abre um `AlertDialog` de confirmação:
   - Título: "Excluir relatório de leitura?"
   - Descrição: cita o condomínio e avisa que as fotos serão removidas mas a leitura/coleta será mantida.
4. Ao confirmar:
   - Remover do `observacao` o trecho que casa `/\s*\|\s*Fotos relatorio:\s*(\[[^\]]*\]|https?:\/\/[^|]+)/i` (e também o caso em que `Fotos relatorio:` aparece no início, sem o `|` anterior).
   - Fazer `update` em `coletas_realizadas` setando o novo `observacao` (string vazia vira `null`).
   - Invalidar a query `['coletas-realizadas']` e exibir `toast.success`.
5. Tratamento de erro com `toast.error`.

### Sem mudanças de banco
Nenhuma migração necessária. A RLS atual já permite ao admin atualizar `coletas_realizadas`. As URLs no Storage `medidor-fotos` são mantidas (não são órfãs críticas; podem ser limpas depois se necessário).

## Fora de escopo
- Excluir a coleta inteira (linha de leitura). Só o relatório.
- Limpeza dos arquivos no Storage.
- Botão de exclusão em massa.
