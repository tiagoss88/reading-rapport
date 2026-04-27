## Corrigir ícone de Foto em "Coletas Realizadas"

### Problema
Em `src/pages/MedicaoTerceirizada/Leituras.tsx`, a função `extrairFotoUrl` usa o regex `/Foto comprovante: (.+)/` (singular). Porém, as coletas reais são salvas no formato plural `Fotos comprovante: [url1, url2] | Obs: ...` (visto em `NovaColetaManualDialog`, `ExecucaoServicoTerceirizado` e `ColetorEmpreendimentoDetalhe`). Como o regex não casa, todas as linhas exibem `ImageOff` e o clique não abre nada.

### Mudanças em `src/pages/MedicaoTerceirizada/Leituras.tsx`

**1. Substituir `extrairFotoUrl` por `extrairFotosUrls(observacao)` que retorna `string[]`**, suportando os 3 formatos existentes:
- `Fotos comprovante: [url1, url2] | Obs: ...` (com colchetes)
- `Fotos comprovante: url1, url2 | Obs: ...` (sem colchetes)
- `Foto comprovante: url | Obs: ...` (singular legado)

**2. Substituir o Dialog modal por um Popover inline** (atende ao pedido "exibida em um box, sem necessidade de abrir em uma outra janela ou pagina"):
- O ícone `Image` vira o `PopoverTrigger`.
- `PopoverContent` mostra a(s) foto(s) em miniatura (grid se houver mais de uma), `max-w-sm`, `max-h-80 object-contain`.
- Remover o `onClick={() => window.open(...)}` que abria nova aba.
- Remover o estado `fotoSelecionada` e o `<Dialog>` de foto (linhas 539–557).

**3. Renderização da célula "Foto"**:
- Se houver fotos: `Popover` com ícone `Image` colorido + badge com a contagem quando > 1.
- Se não houver: continua com `ImageOff` em muted.

### Observação técnica
- Usar `Popover` de `@/components/ui/popover` (já presente no projeto).
- Manter o título "Foto Comprovante" dentro do popover para contexto.