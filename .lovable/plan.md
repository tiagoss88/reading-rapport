

## Corrigir Botao "Abrir Coletor" no Dashboard

### Problema

O botao "Abrir Coletor" no Dashboard navega para `/coletor-sync` (tela de Leituras) em vez de `/coletor` (menu principal do coletor).

### Alteracao

**Arquivo: `src/pages/Dashboard.tsx` (linha 142)**

- Alterar `navigate('/coletor-sync')` para `navigate('/coletor')`

Isso fara o botao direcionar corretamente para o menu principal do coletor, onde o operador pode escolher entre Cronograma, Leituras e Servicos.

