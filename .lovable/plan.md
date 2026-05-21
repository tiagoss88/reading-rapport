## Diagnóstico

No Android, `<input type="file" capture="environment">` com `className="hidden"` (que aplica `display:none`) é bloqueado pelo Chrome/WebView — a câmera não abre. A galeria funciona porque o seletor de arquivos não depende do mesmo gesto/visibilidade.

Padrão atual em `ColetorEmpreendimentoDetalhe.tsx` (e provavelmente outras telas):
```tsx
<Button onClick={() => cameraInputRef.current?.click()}>Tirar Foto</Button>
<input ref={cameraInputRef} type="file" capture="environment" className="hidden" />
```

## Correção

Substituir `className="hidden"` por uma técnica "visualmente oculto mas acessível" no input de câmera (não em `display:none`), em ambos os cards (Sincronização e Relatório de Leitura):

```tsx
const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1, height: 1,
  padding: 0, margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
  opacity: 0,
}

<input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
       style={srOnly} onChange={handleFotoCapture('sincronizacao')} />
```

Os inputs de **Galeria** podem continuar com `className="hidden"` (já funcionam).

## Onde aplicar

- `src/pages/ColetorEmpreendimentoDetalhe.tsx` — 2 inputs de câmera (sincronização + relatório).
- Auditar e aplicar a mesma correção em outras telas com `capture="environment"`:
  - `src/pages/ColetorLeitura.tsx`
  - `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`
  - qualquer outro arquivo onde `rg "capture=\"environment\""` encontrar input com classe `hidden`.

## Critério de aceite

- No Android (Chrome e PWA instalado), tocar em "Tirar Foto" abre a câmera nativa.
- iOS, desktop e botão Galeria continuam funcionando como antes.
- Nenhuma mudança no fluxo de upload/compressão.

## Memória a atualizar

`mem://architecture/mobile-camera-access` — anotar que inputs de câmera devem usar style `sr-only` (não `display:none`) no Android.
