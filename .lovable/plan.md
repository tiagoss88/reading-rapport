## Filtro por UF no Painel de Urgências

### Arquivo único
`src/components/medicao-terceirizada/PainelUrgencias.tsx`

### Mudanças

1. **Estado de filtro**
   - Adicionar `const [ufFiltro, setUfFiltro] = useState<string>('TODAS')` no componente.

2. **Lista dinâmica de UFs disponíveis**
   - Derivar a partir da lista completa de `urgentes` via `useMemo`:
     ```ts
     const ufsDisponiveis = useMemo(
       () => Array.from(new Set(urgentes.map(u => u.servico.uf).filter(Boolean))).sort(),
       [urgentes]
     )
     ```
   - Assim só aparecem botões para UFs que de fato têm serviços urgentes (ex.: BA, CE).

3. **Lista filtrada**
   - `const urgentesFiltrados = ufFiltro === 'TODAS' ? urgentes : urgentes.filter(u => u.servico.uf === ufFiltro)`
   - As variáveis `vencidos`, `criticos`, `atencao` passam a derivar de `urgentesFiltrados`.
   - O `map` da renderização e o `textoResumo` usam `urgentesFiltrados`.

4. **UI dos botões de filtro**
   - Logo abaixo do `CardHeader` (ou dentro dele, em uma segunda linha), adicionar um grupo de botões compactos:
     - "Todas" (default selecionado)
     - Um botão por UF presente em `ufsDisponiveis` (ex.: "BA", "CE")
   - Usar `Button` shadcn com `variant={ufFiltro === uf ? 'default' : 'outline'}` e `size="sm"`, mostrando contador entre parênteses (ex.: `BA (3)`).
   - Esconder o grupo se houver apenas 1 UF disponível (filtro irrelevante).

5. **Cabeçalho do resumo**
   - Quando filtrado, ajustar o título da primeira linha para refletir o escopo:
     ```
     🚨 Serviços com Prazo Crítico — UF: BA — 27/04/2026 14:30
     ```
   - Quando "Todas", manter o formato atual sem o trecho "UF: ...".

6. **Empty state**
   - Se `urgentesFiltrados.length === 0` mas `urgentes.length > 0` (filtro ativo sem resultados), mostrar mensagem curta "Nenhum serviço urgente para a UF selecionada" em vez de esconder o card inteiro, mantendo os botões de filtro visíveis.

### Comportamento esperado

- Por padrão, exibe todos os serviços urgentes (comportamento atual preservado).
- Ao clicar em "BA" ou "CE", a lista, os badges de contagem no header e o conteúdo do "Copiar Resumo" passam a refletir apenas a UF escolhida.
- Sem impacto em queries, schema ou outros componentes.
