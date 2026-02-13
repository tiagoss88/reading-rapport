

## Melhorar o visualizador de fotos na pagina de Leituras

### Problema
O dialog de foto ocupa toda a tela, nao tem botao de fechar visivel e nao permite zoom na imagem.

### Solucao
Melhorar o componente Dialog de visualizacao de foto em `src/pages/MedicaoTerceirizada/Leituras.tsx`:

1. **Limitar tamanho do dialog** - usar `max-w-lg` e `max-h-[80vh]` para que nao ocupe toda a tela
2. **Botao de fechar visivel** - adicionar DialogHeader com titulo "Foto Comprovante" e botao X claro
3. **Zoom na imagem** - ao clicar na imagem, abrir em uma nova aba do navegador (`window.open`) para visualizacao em tamanho real, ou implementar um toggle de zoom dentro do dialog com `object-contain` e scroll
4. **Imagem com proporcao correta** - usar `object-contain` e limitar altura para caber na tela

### Detalhes tecnicos

**Arquivo: `src/pages/MedicaoTerceirizada/Leituras.tsx`**

- Importar `DialogHeader`, `DialogTitle` do dialog
- Ajustar o Dialog existente:
  - Adicionar `DialogHeader` com titulo e instrucao "Clique na imagem para ampliar"
  - Limitar a imagem com `max-h-[60vh] object-contain`
  - Adicionar botao "Abrir em nova aba" que faz `window.open(fotoUrl, '_blank')` para zoom completo
  - Adicionar botao "Fechar" no rodape do dialog

