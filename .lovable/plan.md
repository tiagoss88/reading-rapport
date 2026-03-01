

## Push notification ao criar servico -- Nao precisa de Firebase

Voce **ja tem toda a infraestrutura de push notifications** configurada no projeto:

- **Service Worker** (`public/sw-push.js`) para receber e exibir notificacoes
- **Hook** (`usePushNotifications`) que registra o subscription do operador no Supabase
- **Edge Function** (`send-push-notification`) que envia push via Web Push API com VAPID
- **Tabela** `push_subscriptions` no Supabase

O Firebase **nao e necessario**. O sistema ja usa Web Push API nativa com chaves VAPID, que funciona em todos os navegadores modernos.

O que falta e apenas **disparar a Edge Function** apos a criacao do servico.

---

### Alteracoes

**1. `src/pages/CriarServico.tsx`**
- Apos o insert bem-sucedido na tabela `servicos`, chamar `supabase.functions.invoke('send-push-notification')` com titulo, corpo e URL
- Enviar para todos os operadores (ou filtrar por operador responsavel, se aplicavel)

**2. `src/pages/CriarServicoExterno.tsx`**
- Mesma logica: apos insert bem-sucedido em `servicos_externos`, invocar a Edge Function de push

**3. `src/components/medicao-terceirizada/NovoServicoNacionalGasDialog.tsx`**
- Apos criacao de servico nacional gas, disparar push para o tecnico responsavel (se definido)

Em todos os casos, a chamada sera simples:
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    title: 'Novo Servico',
    body: `Servico "${tipoServico}" agendado para ${data}`,
    url: '/coletor/servicos'
  }
});
```

A notificacao sera enviada a todos os operadores com subscription registrada. O erro na chamada push nao impedira o fluxo principal (sera apenas logado no console).

