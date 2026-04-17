
## Habilitar upload múltiplo no Registro Fotográfico do coletor

### Arquivo: `src/pages/ColetorEmpreendimentoDetalhe.tsx`

A tela já mantém um array `fotos[]` e o backend já salva múltiplas URLs. Falta apenas habilitar a seleção múltipla no input da Galeria e iterar sobre todos os arquivos no handler.

### Mudanças

**1. Input da Galeria** (`galleryInputRef`): adicionar atributo `multiple` para permitir selecionar várias fotos de uma vez. O input da Câmera permanece single (limitação nativa do `capture`).

**2. `handleFotoCapture`**: trocar `event.target.files?.[0]` por loop em `Array.from(event.target.files)`, comprimindo e adicionando cada imagem ao array `fotos`.

**3. Toast**: ajustar mensagem para refletir N fotos adicionadas quando múltiplas.

### Observação
A tela `ExecucaoServicoTerceirizado.tsx` (execução de serviço) já tem `multiple` no input galeria e itera corretamente — sem alteração necessária lá.

Nenhum outro arquivo, schema ou migração afetada.
