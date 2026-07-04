
## Diagnóstico

O preview do Lovable está carregando versões antigas porque o `vite-plugin-pwa` está configurado com `injectRegister` padrão (`'auto'`), então **um Service Worker (`/sw.js`) é registrado automaticamente em todos os ambientes** — inclusive no preview (`id-preview--*.lovable.app`) e no editor. Uma vez registrado, ele passa a servir HTML/assets do cache, então mesmo depois de você editar o código o navegador continua exibindo a versão anterior até o SW revalidar.

Além disso, o `workbox` não define uma estratégia `NetworkFirst` para navegações HTML, o que agrava o efeito de "versão presa".

## O que vou mudar

### 1. `vite.config.ts` (bloco VitePWA)
- `injectRegister: null` — plugin para de injetar o registro automático.
- `devOptions: { enabled: false }` — nenhum SW no dev server.
- `workbox.navigateFallback: 'index.html'` + `runtimeCaching` com `NetworkFirst` para navegações HTML, garantindo que o preview sempre veja a versão mais recente quando houver rede.
- Manter `navigateFallbackDenylist: [/^\/~oauth/]` e o `maximumFileSizeToCacheInBytes` atuais.

### 2. Novo arquivo `src/pwa/registerSW.ts` (wrapper único de registro)
Registro do `/sw.js` **apenas quando todas** as condições são verdadeiras:
- `import.meta.env.PROD` é `true`
- não está dentro de um iframe (`window.top === window.self`)
- `location.search` não contém `?sw=off`
- hostname **não** começa com `id-preview--` nem `preview--`
- hostname **não** é/termina em `lovableproject.com`, `lovableproject-dev.com`, `beta.lovable.dev`

Em qualquer contexto recusado (preview, editor, dev, `?sw=off`), o wrapper **desregistra** qualquer registro existente de `/sw.js` e limpa os caches do Workbox associados. Assim, usuários que já pegaram o SW antigo no preview têm o registro removido no próximo carregamento e passam a ver sempre a versão fresca.

O worker de push existente (`public/sw-push.js`) fica intocado — é outro scope e não faz parte do app shell.

### 3. `src/main.tsx`
Chamar `import('./pwa/registerSW').then(m => m.registerAppSW())` uma única vez após montar o React. Isso substitui o registro automático do plugin.

### 4. Kill-switch de URL
Deixar documentado no chat: se algum usuário ainda ficar preso em versão antiga em produção, abrir a URL com `?sw=off` uma vez força o unregister + limpeza de caches.

## Fora do escopo (não vou mexer)
- `public/sw-push.js` (push notifications) — permanece.
- `clearAppCache.ts` e botões existentes de "Limpar cache" — permanecem como estão.
- Nenhuma mudança no backend, dados ou UI de negócios.

## Como você vai perceber a correção
Depois do próximo publish:
1. No preview do Lovable a página sempre carrega o build mais novo (sem SW ativo).
2. Em produção (domínio publicado), o SW continua funcionando para offline/instalação, mas usando `NetworkFirst` para HTML — mudanças aparecem no primeiro reload com internet.
3. Usuários que hoje têm o SW antigo do preview registrado serão automaticamente "descadastrados" no próximo acesso.
