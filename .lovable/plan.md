## Problema

Mesmo com o kill-switch já implementado em `src/pwa/registerSW.ts`, ao abrir o projeto no editor/preview do Lovable a versão antiga continua sendo exibida na primeira carga. Isso acontece porque:

1. Um Service Worker antigo (`/sw.js`) registrado numa sessão anterior **ainda controla a página** quando ela abre — ele serve o HTML/JS do precache antes de o `cleanupAppSW()` rodar.
2. `cleanupAppSW()` só desregistra o SW e limpa alguns caches, mas **não recarrega a aba**, então o usuário continua vendo o build antigo servido pelo SW até fechar/reabrir.
3. O filtro de caches (`/workbox|precache|runtime|html-navigations/i`) pode deixar buckets antigos com nomes diferentes.
4. O SW de push (`/sw-push.js`) é inofensivo (sem `fetch` handler) e deve ser preservado — não mexer nele.

## O que fazer

Editar apenas `src/pwa/registerSW.ts`:

- Em contexto recusado (preview/editor/dev), detectar se existe registro de `/sw.js` **ou** se `navigator.serviceWorker.controller` está servindo `/sw.js`.
- Desregistrar todos os registros cujo scriptURL termine em `/sw.js`.
- Apagar **todos** os caches do `Cache Storage` da origem, exceto os usados pelo `/sw-push.js` (nenhum hoje, mas manter guard por nome caso passe a existir).
- Se havia SW da app controlando ou registro removido, chamar `window.location.reload()` uma única vez, usando um `sessionStorage` flag (`__lov_sw_reloaded`) para evitar loop.
- Não tocar em `/sw-push.js`, nem em `main.tsx`, `vite.config.ts`, `index.html`.

## Detalhes técnicos

```text
registerAppSW()
 ├─ isRefusedContext() ? 
 │    ├─ hadAppSW = detectAppSW()   // registros + controller
 │    ├─ await unregisterAppSW()
 │    ├─ await clearAllCachesExceptPush()
 │    └─ if (hadAppSW && !sessionStorage['__lov_sw_reloaded']) {
 │          sessionStorage['__lov_sw_reloaded'] = '1'
 │          location.reload()
 │       }
 └─ else register('/sw.js')
```

- `detectAppSW`: retorna true se algum `registration.active/waiting/installing.scriptURL` termina em `/sw.js` **ou** `navigator.serviceWorker.controller?.scriptURL` termina em `/sw.js`.
- `clearAllCachesExceptPush`: `caches.keys()` e deleta tudo (não há cache nomeado pelo `sw-push.js`, então é seguro).
- Flag em `sessionStorage` garante um único reload por aba.

## Efeito esperado

Ao abrir o preview do Lovable: se ainda houver SW antigo controlando a aba, ele é desregistrado, os caches são zerados e a página recarrega uma vez, passando a servir o build atual direto da rede. Em builds futuros, como o preview nunca mais registra SW, o problema não volta a acontecer.