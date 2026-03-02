

## Status atual

O Supabase Realtime já está habilitado nas tabelas e o hook `useRealtimeNotifications` já está implementado e ativo no `ColetorMenu.tsx`.

**Tudo já está pronto para funcionar.** O próximo passo é testar.

## Como testar

1. Abra o coletor em um dispositivo/aba (acesse `/coletor` e faça login como operador)
2. Em outra aba, acesse o painel administrativo e crie um novo serviço
3. Verifique se um toast aparece no coletor com os dados do serviço criado

Se o toast aparecer, a implementação está completa. Se não aparecer, precisaremos investigar se o canal WebSocket está conectando corretamente.

