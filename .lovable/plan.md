

## Push Notification Nativa para Novos Servicos

Push notifications nativas (que aparecem mesmo com o app fechado) requerem a **Web Push API** integrada com o Service Worker do PWA. A arquitetura envolve:

```text
┌─────────────┐    insert servico    ┌──────────────────┐
│  Admin cria  │ ──────────────────► │   Supabase DB    │
│   servico    │                     │  (webhook/trigger)│
└─────────────┘                     └────────┬─────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │  Edge Function   │
                                    │ send-push-notif  │
                                    └────────┬─────────┘
                                             │ web-push
                                    ┌────────▼─────────┐
                                    │  Browser Push    │
                                    │  (operador cel)  │
                                    └──────────────────┘
```

### Etapas de implementacao

**1. Tabela `push_subscriptions` no Supabase**
- Armazena as subscricoes push de cada operador (endpoint, keys p256dh/auth)
- Colunas: `id`, `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`

**2. Gerar par de chaves VAPID**
- Necessario para autenticar push notifications
- Gerar via `npx web-push generate-vapid-keys`
- Chave publica vai no frontend, chave privada como secret do Supabase

**3. Service Worker customizado (`public/sw-push.js`)**
- Listener `push` para exibir a notificacao nativa
- Listener `notificationclick` para abrir o app na rota do coletor

**4. Hook `usePushNotifications` no frontend**
- Solicita permissao do usuario
- Registra subscription via Push API
- Salva subscription na tabela `push_subscriptions`

**5. Tela do Coletor — solicitar permissao**
- No `ColetorMenu`, ao carregar, chamar o hook para registrar push

**6. Edge Function `send-push-notification`**
- Recebe payload (titulo, corpo, url)
- Busca subscriptions dos operadores na tabela
- Envia via protocolo Web Push usando chaves VAPID

**7. Trigger no Supabase (Database Webhook)**
- Ao inserir em `servicos` ou `servicos_nacional_gas`, dispara a edge function

### Pre-requisitos do usuario

Antes de implementar, voce precisa:
1. Gerar chaves VAPID (eu guio o processo)
2. Adicionar a chave privada VAPID como secret no Supabase
3. Criar a tabela `push_subscriptions` via migration

### Limitacoes

- iOS Safari suporta Web Push apenas a partir do iOS 16.4+ e somente quando o PWA esta instalado na home screen
- O operador precisa aceitar a permissao de notificacoes no navegador
- Funciona melhor no Android/Chrome

