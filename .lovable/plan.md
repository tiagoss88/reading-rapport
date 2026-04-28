## Adicionar botão "Limpar cache do app" em Configurações do Sistema

### Objetivo
Permitir que o usuário (admin) limpe o cache do PWA diretamente pela tela **Configurações do Sistema**, sem precisar abrir o DevTools ou as configurações do navegador.

### Mudança

**Arquivo: `src/pages/ConfiguracoesSistema.tsx`**

Adicionar um novo `Card` abaixo do card existente do Mapbox, com:
- **Título:** "Cache do Aplicativo" (ícone `Trash2`)
- **Descrição:** "Limpa todos os caches locais (Service Worker, IndexedDB, CacheStorage) e recarrega o app com a versão mais recente."
- **Botão:** "Limpar cache e recarregar" (ícone `RefreshCw`)
- Ao clicar, abre um `AlertDialog` de confirmação ("Esta ação irá desconectar você e recarregar o app").
- Ao confirmar, executa:
  1. `navigator.serviceWorker.getRegistrations()` → unregister em todos
  2. `caches.keys()` → `caches.delete()` em todos
  3. Limpar `localStorage` apenas das chaves do PWA (`pwa-banner-dismissed`, `coletor_synced_empreendimentos`, `coletor_sync_timestamp`) — **preservando** a sessão Supabase para evitar logout forçado
  4. Toast de sucesso e `location.reload()` (com `window.location.href = window.location.pathname` para garantir reload completo)

### Detalhe técnico
Usar `AlertDialog` de `@/components/ui/alert-dialog` (já existe no projeto). O botão de confirmação fica em vermelho (`variant="destructive"`).

### Resultado
Em **Configurações → Cache do Aplicativo**, basta clicar no botão para forçar o navegador/PWA a buscar a versão mais nova do app — útil quando mudanças não aparecem após deploy.