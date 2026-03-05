

## Plano: Detecção de duplicatas na importação de serviços

### Problema
Atualmente, ao importar uma planilha, o sistema insere todos os registros sem verificar se já existem no banco. Se o usuário importar a mesma planilha duas vezes, todos os serviços ficam duplicados.

### Solução
Após o parsing dos dados, buscar os serviços existentes no banco e comparar com os registros da planilha usando a combinação: **data_solicitacao + uf + condominio_nome_original + bloco + apartamento + morador_nome**. Marcar duplicatas na preview e excluí-las da importação.

### Alteração: `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx`

1. **Adicionar campo `isDuplicate` ao `ImportedRow`** (já existe na interface do `ImportarEmpreendimentosDialog` como referência)

2. **Nova query para buscar serviços existentes** — carregar `servicos_nacional_gas` com campos `data_solicitacao, uf, condominio_nome_original, bloco, apartamento, morador_nome` para usar como base de comparação

3. **Função `checkDuplicate`** — normaliza e compara os campos-chave (lowercase, trim, nulls tratados como string vazia) para gerar uma "chave" de comparação. Verifica tanto duplicatas contra o banco quanto duplicatas internas na própria planilha

4. **Marcar duplicatas no preview** — após o parsing (tanto em `parseFile` quanto em `parseTextData`), rodar a verificação de duplicatas em cada linha e setar `isDuplicate = true` nas linhas que já existem

5. **UI do preview atualizada**:
   - Novo badge ao lado dos contadores existentes: "X duplicados" em vermelho
   - Linhas duplicadas aparecem com fundo vermelho claro e ícone de alerta diferente
   - Coluna "Status" mostra "Duplicado" para essas linhas

6. **Filtrar duplicatas na importação** — no `importMutation`, inserir apenas `parsedData.filter(r => !r.isDuplicate)`. Se todos forem duplicados, desabilitar o botão de importar

7. **Botão de importar** mostra contagem correta: "Importar X serviço(s)" (excluindo duplicados)

### Nenhuma alteração de banco necessária
A verificação é feita client-side comparando dados do parsing com uma consulta SELECT existente.

