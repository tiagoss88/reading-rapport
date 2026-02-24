

## Adicionar filtro de UF (BA/CE) na tela de Serviços Terceirizados do Coletor

O operador precisa filtrar os serviços por estado (BA ou CE) para focar nos serviços da sua região.

### Arquivo a editar

**`src/pages/ColetorServicosTerceirizados.tsx`**

1. Adicionar `uf` à interface `ServicoTerceirizado` e ao select da query Supabase
2. Adicionar estado `selectedUF` (valores: `'todos'`, `'BA'`, `'CE'`)
3. Adicionar filtro de botões (BA / CE / Todos) abaixo do header, antes da lista
4. Filtrar `servicos` pelo `selectedUF` antes de renderizar a lista
5. Mostrar a UF como badge pequena em cada card da lista, ao lado do nome do condomínio

### Detalhes técnicos

- O campo `uf` já existe na tabela `servicos_nacional_gas` (tipo `string`, valores `'BA'` ou `'CE'`)
- O filtro será feito no frontend (client-side) sobre os dados já carregados, sem query adicional
- Layout do filtro: dois botões estilo toggle (BA e CE) + opção "Todos", posicionados entre o header e a lista de serviços
- Cada card mostrará uma badge com a UF para contexto visual rápido

