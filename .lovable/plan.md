

## Unificar botões de registro fotográfico

### Alteração: `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`

Substituir os dois botões separados (Câmera e Galeria) por um único botão "Adicionar Foto". O input usará `accept="image/*"` sem o atributo `capture`, o que faz o sistema operacional do celular oferecer automaticamente as duas opções (câmera ou galeria) ao usuário. Também mantém `multiple` para permitir seleção de várias fotos de uma vez.

### Detalhes técnicos

- Remover os dois `<label>` com inputs separados (câmera com `capture="environment"` e galeria com `multiple`)
- Criar um único `<label>` com `<input type="file" accept="image/*" multiple>` (sem `capture`)
- Botão com ícone de câmera e texto "Adicionar Foto"
- Largura total (`w-full`) para manter visual limpo

