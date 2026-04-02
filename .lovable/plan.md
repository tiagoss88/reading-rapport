

## Corrigir câmera e adicionar compressão de imagens

### Problema 1: Câmera não funciona
O input atual usa `accept="image/*"` sem `capture`, o que no celular abre um menu com opções de câmera e galeria. Porém, o `<input>` está dentro de um `<label>` com `<Button asChild>`, e o clique pode não estar propagando corretamente para o input.

### Problema 2: Compressão
A compressão já está implementada via `smartCompress` na linha 127. As imagens já são compactadas antes de serem armazenadas. Porém, podemos garantir que isso funcione corretamente revisando o fluxo.

### Solução

**Arquivo: `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`**

1. **Substituir o padrão `<label>` + `<Button asChild>`** por um `<input ref={fileRef}>` oculto + `<Button onClick={() => fileRef.current?.click()}>` — mesmo padrão usado com sucesso nos outros componentes (`NovaColetaManualDialog`, `EditarColetaDialog`). Isso resolve o problema da câmera não abrir.

2. **Adicionar `ref` para o input** usando o `fileRef` que já existe no componente (ou criar se não existir).

3. **Manter `accept="image/*" multiple`** sem `capture` para que o SO ofereça câmera e galeria.

4. A compressão via `smartCompress` já está funcionando no `handleFileSelect` (linha 127). Não precisa de alteração.

### Alteração concreta (linhas 293-298)

Trocar:
```tsx
<label className="block">
  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
  <Button variant="outline" className="w-full" asChild>
    <span><Camera className="w-4 h-4 mr-2" />Adicionar Foto</span>
  </Button>
</label>
```

Por:
```tsx
<input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
<Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
  <Camera className="w-4 h-4 mr-2" />Adicionar Foto
</Button>
```

E adicionar `const fileRef = useRef<HTMLInputElement>(null)` na declaração de refs do componente (se não existir).

