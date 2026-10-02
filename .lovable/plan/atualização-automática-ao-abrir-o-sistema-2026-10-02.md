# Atualização automática ao abrir o sistema

## Diagnóstico
- O cache offline antigo já foi removido; hoje não há service worker guardando telas (só o de notificações, que não guarda nada).
- O que sobra: o app instalado no celular / aba aberta fica "parado" na versão carregada. Ao voltar para ele, o sistema não confere se existe versão nova, então mostra a antiga até alguém limpar o cache.
- Depois de uma publicação, telas que carregam sob demanda podem falhar ao abrir porque o arquivo antigo não existe mais.

## O que será feito
1. **Selo de versão**: cada publicação gera um arquivo pequeno com o número da versão.
2. **Conferência automática**: o sistema compara sua versão com a publicada ao abrir, ao voltar para o app/aba e a cada 5 minutos (sem cache).
3. **Atualização sozinha**: se houver versão nova, recarrega automaticamente quando a pessoa não estiver no meio de um formulário; se estiver, mostra um aviso "Nova versão disponível — Atualizar".
4. **Proteção contra tela quebrada**: se uma tela falhar por arquivo antigo, o sistema recarrega uma vez sozinho para buscar a versão nova.
5. A página "Limpar cache" continua existindo como reserva.

## Detalhes técnicos
- Plugin no `vite.config.ts` que grava `dist/version.json` com id do build e injeta `__APP_VERSION__`.
- Hook `useVersionCheck` montado em `App.tsx`: `fetch('/version.json?t=…', {cache:'no-store'})`, gatilhos `visibilitychange`, `focus`, intervalo 5 min; reload com guarda em sessionStorage para evitar loop. Desativado em desenvolvimento.
- Listener `vite:preloadError` + tratamento no `ErrorBoundary` para "Failed to fetch dynamically imported module" → reload único.
- Meta `Cache-Control: no-cache` no `index.html` como reforço.
