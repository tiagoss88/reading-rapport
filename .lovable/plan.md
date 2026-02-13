

## Visualizar foto do comprovante nas Coletas Realizadas

### O que muda
Na aba "Coletas Realizadas" da pagina de Leituras, sera adicionada uma nova coluna "Foto" na tabela. Cada linha mostrara um icone clicavel (miniatura ou botao) que abre a foto do comprovante em um lightbox/dialog para visualizacao ampliada.

### Como vai funcionar
- Uma nova coluna "Foto" aparece na tabela de coletas realizadas
- Se a coleta possui foto (extraida do campo `observacao` que contem "Foto comprovante: URL"), aparece um icone/miniatura clicavel
- Ao clicar, um Dialog abre com a imagem em tamanho ampliado
- Se nao ha foto, mostra um indicador "Sem foto"

### Detalhes tecnicos

**Arquivo modificado: `src/pages/MedicaoTerceirizada/Leituras.tsx`**

1. Adicionar estado para controlar o dialog da foto (`fotoDialogOpen`, `fotoSelecionada`)
2. Criar funcao auxiliar para extrair a URL da foto do campo `observacao` (regex para capturar URL apos "Foto comprovante: ")
3. Adicionar coluna "Foto" na tabela de Coletas Realizadas com miniatura clicavel (icone `Image` ou thumbnail)
4. Adicionar um componente `Dialog` que exibe a imagem ampliada quando clicada
5. Importar `Dialog`, `DialogContent` e icone `Image` do lucide-react

**Logica de extracao da URL:**
```
const extrairFotoUrl = (observacao: string | null) => {
  if (!observacao) return null
  const match = observacao.match(/Foto comprovante: (.+)/)
  return match ? match[1] : null
}
```
