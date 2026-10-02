# Remover a observação interna do card da lista de serviços (coletor)

## O que mudar

- Em `src/pages/ColetorServicosTerceirizados.tsx` (linhas ~530-536), remover o bloco do card que exibe "Obs. interna:" em resumo (2 linhas) nos cards da lista de serviços.

## O que permanece

- A observação interna continua aparecendo no destaque com botão de copiar logo abaixo das informações do serviço (tela de detalhe/execução), como está hoje.
- Nenhuma alteração de banco, dados, gravação ou outras telas.

## Verificação

- Typecheck (`npx tsgo --noEmit -p tsconfig.app.json`).
- Conferir na pré-visualização do coletor que o card volta a não mostrar a observação e que a tela de detalhe continua mostrando-a.
