# Mostrar a aba Armazéns mesmo antes de rodar o script

## Por que não aparece
As abas do Estoque só aparecem depois que o banco é atualizado. Enquanto o script dos armazéns não for rodado, a tela mostra o aviso "Atualização do estoque pendente" no lugar das abas, por isso a aba Armazéns some. No site oficial, ela também só aparece depois de publicar.

## O que vai mudar
- As quatro abas (Materiais, Movimentações, Baixa por serviço, Armazéns) ficam sempre visíveis quando o estoque básico já está instalado.
- Enquanto o script dos armazéns não for rodado:
  - uma faixa no topo avisa "Atualização dos armazéns pendente", com os botões **Copiar script** e **Verificar novamente**;
  - Materiais, Movimentações e Baixa por serviço continuam funcionando como antes (saldo total, sem escolher armazém);
  - a aba Armazéns abre mostrando o passo a passo e o script, em vez da lista.
- Depois de rodar o script e clicar em Verificar novamente, tudo passa a funcionar com armazéns, sem recarregar.

## Detalhes técnicos
- `Estoque.tsx`: o estado `atualizacao_pendente` renderiza as abas mais uma faixa de aviso, com uma prop `modoLegado` repassada às abas.
- `useEstoque.ts`: `useMateriaisSaldo(modoLegado)` lê `v_estoque_saldo` (total) quando legado; `useMovimentacoes` não seleciona `armazem_id`/`transferencia_id` e não consulta `armazens` quando legado; `useArmazens` fica desligado.
- `MovimentacoesTab`: em modo legado, esconde o campo/filtro de armazém e o botão Transferir, e grava sem `armazem_id`.
- `MateriaisTab`: em modo legado, sem colunas por armazém.
- `ArmazensTab`: em modo legado, mostra `EstoqueNaoInstalado somenteArmazens`.
