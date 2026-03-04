

## Plano: Adicionar exclusão de coletas com confirmação

### Alteração
**`src/pages/MedicaoTerceirizada/Leituras.tsx`**

1. Importar `AlertDialog` e componentes relacionados, e o ícone `Trash2`
2. Adicionar estado `coletaExcluir` para armazenar a coleta selecionada para exclusão
3. Na coluna "Ações" (linha ~413), adicionar botão com ícone `Trash2` ao lado do botão de edição existente
4. Ao clicar, setar `coletaExcluir` com a coleta correspondente, abrindo o `AlertDialog`
5. O `AlertDialog` exibe mensagem "Tem certeza que deseja excluir esta coleta de [nome do condomínio]?" com botões "Cancelar" e "Excluir"
6. Ao confirmar, executar `DELETE` em `servicos_nacional_gas` pelo `id` e invalidar query `coletas-realizadas`
7. Toast de sucesso/erro após operação

### Nenhuma alteração de banco necessária
A RLS já permite que admins deletem registros de `servicos_nacional_gas` (policy "Admins podem deletar servicos ng").

### Arquivo modificado
- `src/pages/MedicaoTerceirizada/Leituras.tsx`

