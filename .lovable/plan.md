

## Plano: Observação e múltiplas fotos na tela de coleta do empreendimento

### O que muda
Na tela que o operador usa para confirmar a coleta (screenshot enviado), adicionar:
1. **Campo de observação** (Textarea) — opcional, para o operador registrar acontecimentos
2. **Suporte a múltiplas fotos** — câmera e galeria, com preview em grid e opção de remover individualmente

### Arquivo alterado
**`src/pages/ColetorEmpreendimentoDetalhe.tsx`**

- Trocar estado `foto`/`fotoPreview` (single) por `fotos[]` (array de `{file, preview}`)
- Adicionar estado `observacao` (string)
- `handleFotoCapture` passa a adicionar ao array em vez de substituir
- Função `removerFoto(index)` para excluir uma foto do array
- No `confirmarColeta`: fazer upload de todas as fotos em paralelo, concatenar URLs no campo `observacao` existente (formato: `Foto comprovante: url1, url2... | Obs: texto do operador`)
- Na UI: adicionar `<Textarea>` antes da seção de fotos, mostrar grid de previews com botão X para remover, manter botões Tirar Foto / Galeria sempre visíveis

### Sem alteração no banco
Reutiliza o campo `observacao` já existente em `servicos_nacional_gas` para guardar tanto as URLs das fotos quanto a observação do operador. Nenhuma migration necessária.

