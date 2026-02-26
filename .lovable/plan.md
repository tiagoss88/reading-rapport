

## Adicionar Busca e Paginacao na Aba "Coletas Realizadas"

### Alteracoes

**Arquivo: `src/pages/MedicaoTerceirizada/Leituras.tsx`**

1. **Novos states**:
   - `buscaColeta` (string, default `''`) — termo de busca por nome do empreendimento
   - `itensPorPagina` (number, default `10`) — quantidade de itens por pagina

2. **UI no CardHeader** (linha 269, apos os filtros existentes):
   - Adicionar um `Input` com icone de busca e placeholder "Buscar condominio..."
   - Adicionar um `Select` com opcoes 10, 25, 50, 100 para limitar itens exibidos

3. **Logica de filtragem e paginacao** (linha 323):
   - Filtrar `coletasFiltradas` pelo termo de busca (comparando com `emp?.nome` via `toLowerCase().includes()`)
   - Aplicar `.slice(0, itensPorPagina)` no resultado
   - Exibir contador "Mostrando X de Y" abaixo da tabela

### Resultado

A aba "Coletas Realizadas" tera uma barra de busca por nome e um seletor de quantidade de itens, tornando a navegacao mais eficiente em listas grandes.

