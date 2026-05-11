## Problema

Em `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx`, a função `makeDuplicateKey` inclui `data_solicitacao` na chave de comparação:

```ts
return [
  norm(row.data_solicitacao),  // ← aqui está o problema
  norm(row.uf),
  norm(row.condominio_nome_original),
  norm(row.bloco),
  norm(row.apartamento),
  norm(row.morador_nome),
].join('|')
```

Como o serviço já existente no banco (ex.: Sonata Bloco B Apto 302) muitas vezes tem **data_solicitacao diferente** da planilha importada (ou está nula), a chave nunca bate e o registro é tratado como novo — mesmo sendo o mesmo cliente/condomínio/unidade/morador.

Isso contraria a regra que você definiu: a verificação deve usar **condomínio + bloco/apto + morador** (sem considerar data nem protocolo).

## Solução

Ajustar `makeDuplicateKey` para remover `data_solicitacao` e considerar apenas:

- `uf`
- `condominio_nome_original` (normalizado: lowercase + trim + remover acentos + colapsar espaços)
- `bloco`
- `apartamento`
- `morador_nome`

E atualizar a query `existingServices` para não trazer `data_solicitacao` (não é mais necessária para a chave).

### Detalhes técnicos

1. **`makeDuplicateKey`**: remover `data_solicitacao`; adicionar normalização que remove acentos (`NFD` + remoção de diacríticos) e colapsa espaços, alinhando com o padrão já usado em `ImportarEmpreendimentosDialog.tsx`.
2. **Query `servicos-nacional-gas-duplicates`**: selecionar apenas `uf, condominio_nome_original, bloco, apartamento, morador_nome`.
3. Manter o comportamento atual de marcar duplicados na UI (badge amarelo) e excluí-los do insert — só muda a chave.
4. Não alterar nada no banco; é apenas ajuste de lógica de comparação no frontend.

### Fora do escopo

- Não vou adicionar constraint de unicidade no banco agora (poderia bloquear inserts legítimos de re-execução de serviço para o mesmo morador). Se quiser, posso propor isso depois.
- Não vou mexer em serviços já duplicados no banco — a limpeza dos atuais é tema separado.