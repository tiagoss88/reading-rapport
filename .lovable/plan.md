

## Corrigir Banner de Instalacao PWA

### Problema raiz

O evento `beforeinstallprompt` do Chrome frequentemente dispara **antes** do React montar os componentes. Como o listener so e registrado quando o `ColetorMenu` renderiza, o evento ja passou e o banner nunca aparece.

### Alteracoes

**1. Capturar o evento globalmente em `src/main.tsx`**
- Adicionar um listener `beforeinstallprompt` no escopo global, antes do React montar
- Salvar o evento em `window.__deferredInstallPrompt` para o hook consumir depois

**2. Atualizar `src/hooks/useInstallPrompt.tsx`**
- No `useEffect`, verificar se `window.__deferredInstallPrompt` ja existe (evento que disparou antes do mount)
- Se existir, usar esse evento imediatamente e mostrar o banner
- Manter o listener para o caso do evento ainda nao ter disparado

**3. Limpar localStorage para testes**
- Adicionar log no console para debug (`[PWA] banner state: ...`)
- Garantir que `pwa-banner-dismissed` nao esta bloqueando a exibicao

### Nota importante
O evento `beforeinstallprompt` **nao dispara** no preview do Lovable (iframe). O teste deve ser feito no dominio real `ngd.agasen.com.br` apos o deploy. Tambem e necessario que o usuario **nao tenha o app ja instalado** e esteja usando Chrome no Android.

