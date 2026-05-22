
## Problema

Ao clicar em "Galeria" no coletor, o seletor de imagens do Android só permite escolher uma foto por vez. O usuário precisa repetir o fluxo várias vezes para anexar várias fotos.

Os `<input type="file" multiple>` já estão configurados corretamente no código. O problema é o app rodando dentro do **WebView do Capacitor**: o seletor padrão acionado por `input[type=file]` no WebView Android frequentemente abre o aplicativo de galeria nativo, que **não respeita o atributo `multiple`** e devolve apenas 1 arquivo.

A solução robusta é usar o plugin **@capacitor/camera** (`Camera.pickImages`) que abre o Android Photo Picker nativo com suporte real a múltipla seleção. Mantemos o `<input>` como fallback quando rodando no navegador (PWA puro / desktop).

## Mudanças

### 1. Instalar plugin
- `@capacitor/camera` (compatível com Capacitor 7)

### 2. Criar helper `src/lib/pickImages.ts`
Função única `pickImagesMulti(): Promise<File[]>` que:
- Detecta plataforma via `Capacitor.isNativePlatform()`.
- **Nativo (Android/iOS):** chama `Camera.pickImages({ limit: 0, quality: 90 })`, baixa cada `webPath` via `fetch` + `blob()` e converte em `File`.
- **Web/PWA:** cria um `<input type="file" multiple accept="image/*">` programático e resolve com `Array.from(files)`.

Também exportar `takePhotoNative()` que usa `Camera.getPhoto({ source: CameraSource.Camera })` no nativo e fallback para `input capture="environment"` no web — útil para resolver também o problema anterior da câmera não abrir.

### 3. Refatorar pontos de captura de fotos
Substituir o par "botão Galeria + `<input ref>` escondido" por chamada direta ao helper nos seguintes locais (todos já têm um `handleFotoCapture` que recebe `File[]`):

- `src/pages/ColetorEmpreendimentoDetalhe.tsx` — cards "Fotos de Sincronização" e "Fotos do Relatório de Leitura" (botões Câmera + Galeria de cada um).
- `src/pages/ColetorNotificacoes.tsx` — botão "Galeria" (e Câmera).
- `src/pages/ColetorLeitura.tsx` — input com `capture` e seu par de galeria.

Padrão de uso:
```ts
const files = await pickImagesMulti();
if (files.length) await handleFotoCapture(files); // adapta a assinatura para receber File[]
```

Os `<input>` escondidos podem ser removidos (ou mantidos apenas como fallback interno do helper).

### 4. Configuração Android (somente runtime nativo)
Nenhuma permissão adicional precisa ser declarada manualmente — `@capacitor/camera` já injeta as permissões necessárias (`READ_MEDIA_IMAGES`, etc.) ao rodar `npx cap sync`. **O usuário precisará rodar `npx cap sync android` e regerar o APK** para que a mudança tenha efeito no app instalado. No PWA puro a melhoria via fallback web já passa a valer imediatamente.

## Detalhes técnicos

- `Camera.pickImages({ limit: 0 })` → `limit: 0` significa "sem limite" no Android Photo Picker.
- Conversão do retorno:
  ```ts
  const res = await Camera.pickImages({ limit: 0 });
  const files = await Promise.all(res.photos.map(async (p, i) => {
    const blob = await (await fetch(p.webPath!)).blob();
    return new File([blob], `foto_${Date.now()}_${i}.${p.format ?? 'jpg'}`, { type: blob.type });
  }));
  ```
- Não alterar `smartCompress`/`compressImage` — continuam recebendo `File`.

## Fora de escopo

- Mudanças visuais nos cards (mantém layout atual).
- Alterações no fluxo de upload/storage.
- Mexer em outras telas de fotos não citadas.
