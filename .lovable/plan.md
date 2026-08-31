# Corrigir 404 ao abrir "Log de Erros"

## O que foi verificado

- A rota `/configuracoes/logs` existe no app e aponta para a página Log de Erros, com acesso restrito a admin.
- O item do menu lateral aponta para o mesmo endereço.
- No preview local a rota não retorna 404: sem sessão ela apenas redireciona para o login.

Ou seja, o código está correto; o 404 aparece na versão publicada/em cache, que ainda não contém a nova rota.

## Plano

1. Republicar o app para que a versão publicada (incluindo ngd.agasen.com.br) receba a rota nova.
2. Limpar cache do navegador/service worker na sessão de teste e recarregar.
3. Validar, logado como admin, que Configurações → Log de Erros abre a tela corretamente (lista, filtros, detalhes).
4. Caso ainda apareça 404 após publicar, investigar a origem: se for a tela 404 do app (rota não encontrada pelo React Router) ou tela de "não autorizado" por falta do papel admin no usuário em uso — e corrigir conforme o caso.

## Detalhes técnicos

- Rota já registrada em `src/App.tsx` dentro de `ProtectedRoute` + `PermissionRoute role="admin"`.
- Item de menu em `src/components/Layout.tsx` (`/configuracoes/logs`, visível apenas para admin).
- Nenhuma alteração de código prevista, a menos que o passo 4 revele um problema real.
