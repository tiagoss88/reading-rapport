

## Melhorar responsividade do menu lateral

### Problemas identificados

1. **Submenus fecham ao navegar**: Os estados `medicaoTerceirizadaOpen` e `configuracoesOpen` iniciam como `false`. Quando o usuario navega para um subitem, o menu fecha (no mobile) e ao reabrir, os dropdowns estao fechados -- o usuario perde o contexto de onde esta.

2. **No mobile, o sidebar fecha ao clicar em qualquer item**: O `onClick={() => setSidebarOpen(false)}` esta em todos os NavLinks, inclusive nos subitens. Isso e correto no mobile (pois o sidebar e um overlay), mas os dropdowns deveriam reabrir automaticamente mostrando o item ativo.

### Solucao

**Arquivo: `src/components/Layout.tsx`**

1. **Auto-abrir o dropdown que contem a rota atual**: Usar `useLocation()` do React Router para detectar a rota atual e inicializar os estados dos dropdowns automaticamente.

2. **Inicializar estados com base na rota**: Em vez de `useState(false)`, calcular o estado inicial verificando se a rota atual pertence ao grupo:
   - Se a URL comeca com `/medicao-terceirizada` -> `medicaoTerceirizadaOpen = true`
   - Se a URL comeca com `/configuracoes`, `/operadores` ou `/permissions` -> `configuracoesOpen = true`

3. **Manter dropdowns abertos no mobile**: Quando o usuario clica em um subitem no mobile, o sidebar fecha (comportamento correto), mas ao reabrir, o dropdown correto estara aberto automaticamente porque o estado e derivado da rota.

### Detalhes tecnicos

- Importar `useLocation` de `react-router-dom`
- Usar `useMemo` ou logica direta para determinar qual dropdown deve estar aberto
- Trocar `useState(false)` por `useState(() => pathname.startsWith('/medicao-terceirizada'))` para Medicao Terceirizada
- Trocar `useState(false)` por `useState(() => ['/configuracoes', '/operadores', '/permissions'].some(p => pathname.startsWith(p)))` para Configuracoes
- Adicionar `useEffect` que reage a mudancas de rota para garantir que o dropdown correto abre quando o usuario navega

### Resultado esperado

- Ao acessar qualquer pagina dentro de "Medicao Terceirizada", o dropdown ja aparece aberto com o item ativo destacado
- No mobile, ao reabrir o menu lateral, o dropdown correto esta expandido e o item atual esta visualmente destacado (com `bg-primary`)
- O usuario sempre sabe em qual secao do sistema esta navegando
