# Devolver ao estoque o material de OS excluída

## O que acontece hoje
Ao excluir uma OS, as saídas de material dela continuam no estoque, só perdem o vínculo com a OS. Por isso o material da AG-004725 segue descontado.

## O que vai ser feito

### 1. Devolução automática ao excluir uma OS (script que você roda)
- Quando uma OS for excluída, o sistema lança uma **entrada de estorno** para cada material que saiu por ela, no mesmo armazém e na mesma quantidade.
- Motivo registrado: "Estorno - OS excluída NG/AG-…", para ficar claro no histórico e nos relatórios.
- Protegido: se o estorno falhar, a exclusão da OS acontece normalmente e o aviso vai para o Log de Erros.

### 2. Botão "Estornar" em Movimentações (para casos passados, como a AG-004725)
- Em cada saída da lista aparece **Estornar**. Ao confirmar, entra de volta a mesma quantidade no mesmo armazém, com o motivo "Estorno de saída" e uma observação opcional.
- Uma saída já estornada mostra "Estornada" e não pode ser estornada de novo.
- Para achar a AG-004725: filtrar o período e buscar pelo motivo que contém o número da OS.

### 3. Aviso na exclusão
- Ao excluir uma OS com materiais lançados, a confirmação avisa: "Os materiais desta OS voltarão ao estoque".

## Ordem
1. Publicar as telas (o botão Estornar já funciona sem script).
2. Estornar as saídas da AG-004725 em Movimentações.
3. Rodar o script para que as próximas exclusões devolvam sozinhas.

## Detalhes técnicos
- `supabase/manual/estoque_estorno_os.sql` (idempotente): coluna `estorno_de uuid` em `estoque_movimentacoes` (índice único parcial para impedir estorno duplo); função `before delete` em `servicos_nacional_gas` que insere `entrada` para cada `saida` com `servico_id = OLD.id`, copiando material/armazém/quantidade e `estorno_de`, com `exception when others` gravando em `logs_erro` e `RETURN OLD`. Precisa ser BEFORE porque a FK é `ON DELETE SET NULL`.
- `MovimentacoesTab.tsx`: botão Estornar nas saídas (insert de `entrada`; usa `estorno_de` se a coluna existir, senão grava referência na observação). Estornos de transferência ficam fora (usar nova transferência).
- `Servicos.tsx`: consulta saídas da OS antes de excluir para mostrar o aviso.
