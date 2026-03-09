

## Diagnostico: Push Notifications nao funcionam no WebView

Existem **dois problemas** que impedem as notificacoes push de funcionar:

### Problema 1: Chave VAPID nao configurada

A variavel `VITE_VAPID_PUBLIC_KEY` **nao existe** no arquivo `.env`. O hook `usePushNotifications` verifica essa variavel na linha 24 e retorna imediatamente se estiver vazia -- a assinatura push nunca e registrada, logo nenhum dispositivo recebe notificacoes.

**Correcao**: Adicionar `VITE_VAPID_PUBLIC_KEY` ao `.env` com a chave VAPID publica correspondente a chave privada configurada nos secrets do Supabase Edge Functions.

### Problema 2: WebView nao suporta Push API

Este e o problema principal. Aplicativos WebView (Android WebView / WKWebView no iOS) **nao suportam Service Workers nem a Push API**. Isso significa que mesmo com a chave VAPID configurada, o `navigator.serviceWorker.register()` e o `PushManager.subscribe()` vao falhar silenciosamente no WebView.

As opcoes para resolver:

**Opcao A - Polling no app (mais simples, sem mudanca no app nativo)**
- Criar um sistema de polling no frontend que consulta periodicamente uma tabela `notificacoes` no Supabase
- Quando um servico e criado, insere uma notificacao na tabela
- O coletor verifica a cada X segundos se ha novas notificacoes e exibe um toast/alerta
- Funciona em qualquer WebView sem dependencias nativas

**Opcao B - Supabase Realtime (mais eficiente)**
- Usar `supabase.channel()` para escutar insercoes em tempo real na tabela de servicos
- Quando um novo servico e inserido, o coletor recebe o evento instantaneamente e exibe um toast
- Nao precisa de polling, funciona via WebSocket (suportado em WebViews)
- Mais eficiente que polling

**Opcao C - Push nativo via Firebase (mais complexo)**
- Requer modificar o app nativo para integrar FCM/APNs
- Complexidade significativamente maior

### Recomendacao

**Opcao B (Supabase Realtime)** e a melhor para o cenario atual:
- Funciona em WebView
- Notificacao instantanea (sem delay de polling)
- Ja tem Supabase configurado
- Implementacao apenas no frontend

### Implementacao (Opcao B)

1. **Criar hook `useRealtimeNotifications.tsx`** que:
   - Escuta insercoes na tabela `servicos` e `servicos_nacional_gas` via Realtime
   - Exibe um toast com os dados do novo servico
   - Opcionalmente reproduz um som de alerta

2. **Adicionar o hook no `ColetorMenu.tsx`** (onde ja esta o `usePushNotifications`)

3. **Habilitar Realtime** nas tabelas `servicos` e `servicos_nacional_gas` no Supabase (configuracao no dashboard)

### Arquivos alterados
- Novo: `src/hooks/useRealtimeNotifications.tsx`
- Editado: `src/pages/ColetorMenu.tsx` (substituir `usePushNotifications` pelo novo hook)

