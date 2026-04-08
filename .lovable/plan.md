

## Corrigir câmera Android — separar inputs para Câmera e Galeria

### Problema

O input atual usa `accept="image/*"` sem o atributo `capture`, o que no Android WebView pode não abrir a câmera diretamente. Em ambientes WebView, um único input sem `capture` tende a abrir apenas o seletor de arquivos/galeria.

### Solução: `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`

Substituir o input único e o botão "Adicionar Foto" por **dois inputs ocultos** e **dois botões** (mesmo padrão já usado em `ColetorNotificacoes.tsx`):

1. Adicionar um segundo ref: `const cameraRef = useRef<HTMLInputElement>(null)`
2. Substituir o input e botão atuais (linhas 302-305) por:

```tsx
<input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
<input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
<div className="flex gap-2">
  <Button variant="outline" className="flex-1" onClick={() => cameraRef.current?.click()}>
    <Camera className="w-4 h-4 mr-2" />Câmera
  </Button>
  <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
    <ImagePlus className="w-4 h-4 mr-2" />Galeria
  </Button>
</div>
```

3. Adicionar `ImagePlus` ao import de `lucide-react`

O atributo `capture="environment"` força o Android a abrir a câmera traseira diretamente.

