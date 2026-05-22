## Objetivo

Garantir que ao clicar em "Galeria" seja possível selecionar **várias fotos de uma só vez** em todos os pontos do coletor — inclusive os que ainda usam o `<input type="file">` antigo.

## Estado atual

Já foi implementado multi-seleção nativa (via `@capacitor/camera` + helper `src/lib/pickImages.ts`) em:
- `src/pages/ColetorEmpreendimentoDetalhe.tsx` (Sincronização + Relatório de Leitura)
- `src/pages/ColetorNotificacoes.tsx`

Ainda falta em:
- `src/pages/ColetorLeitura.tsx` — usa apenas 1 foto via `<input ref capture="environment">`.

## Mudanças

### 1. `src/pages/ColetorLeitura.tsx` — suportar múltiplas fotos

- Trocar o estado:
  - `foto: File | null` → `fotos: File[]`
  - `fotoPreview: string | null` → `fotosPreview: string[]` (mantém compatibilidade com `leituraExistente.foto_url` inicial, transformando em array de 1).
- Substituir os dois botões/inputs por **dois botões separados** (padrão já usado nas outras telas):
  - **Câmera** → `takePhotoNative()` (1 foto, adicionada ao array).
  - **Galeria** → `pickImagesMulti()` (várias fotos).
- Remover o `<input ref={fileInputRef} ...>` escondido.
- Mostrar grid de miniaturas com botão "remover" em cada uma; manter aparência compacta atual.
- No `salvarLeitura`:
  - Fazer upload de **todas** as fotos para `medidor-fotos/leituras/...`.
  - Salvar a **primeira** URL em `foto_url` (mantém schema atual).
  - Concatenar as URLs adicionais em `observacao` no padrão já documentado na memória: `Fotos comprovante: [url1 | url2 | ...] | Obs: [texto do usuário]`. Assim nada quebra no relatório/admin e fotos extras ficam acessíveis.
- Ao editar (`leituraExistente`), pré-carregar `foto_url` como primeira miniatura e extrair eventuais URLs já concatenadas em `observacao` para o array.

### 2. Sem mudanças em outras telas

`ColetorEmpreendimentoDetalhe.tsx` e `ColetorNotificacoes.tsx` já estão corretos — não tocar.

### 3. Build nativo

Lembrar o usuário ao final: para valer no APK Android instalado é necessário `npx cap sync android` + reinstalar. No PWA o fallback web (`<input multiple>` programático) já passa a valer imediatamente.

## Fora de escopo

- Mudar schema do banco (coluna nova de fotos).
- Alterar fluxos de upload das outras telas.
- Mudanças visuais além do grid de miniaturas necessário para múltiplas fotos.
