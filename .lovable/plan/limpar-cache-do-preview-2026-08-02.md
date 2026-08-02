# Limpar cache do preview

Objetivo: fazer o preview carregar a versão mais recente do sistema (incluindo o botão "Replicar mês anterior" e o novo seletor de dia útil no diálogo de replicação).

## O que será feito

1. Abrir o preview em uma sessão automatizada.
2. Remover service workers registrados.
3. Apagar todos os caches (Cache API) e IndexedDB.
4. Limpar localStorage e sessionStorage.
5. Recarregar a aplicação na tela de login já com a versão atualizada.

## Observação

Nenhum arquivo do projeto é alterado nesta etapa — é apenas uma limpeza de estado do navegador do preview.
