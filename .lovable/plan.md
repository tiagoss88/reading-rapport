# Ordenação nas colunas de data da GTI

## Objetivo
Permitir ordenar crescente/decrescente as colunas **Leitura anterior**, **Prazo inicial** e **Prazo final** da tabela GTI, com clique no cabeçalho.

## Escopo
- Apenas as três colunas de data terão ordenação (resposta do usuário).
- Comportamento do clique: crescente → decrescente → desfazer (volta à ordem original do backend: UF + condomínio).
- Apenas frontend; nenhuma mudança no backend.

## Implementação

### 1. Estado de ordenação
Adicionar em `src/components/medicao-terceirizada/gti/GtiTab.tsx`:

```text
type SortColumn = 'leitura_anterior' | 'prazo_inicial' | 'prazo_final'
type SortDirection = 'asc' | 'desc'

const [sort, setSort] = useState<{ column: SortColumn | null; direction: SortDirection | null }>({ column: null, direction: null })
```

### 2. Cabeçalhos clicáveis
Nos três `TableHead` de data, substituir o texto simples por um botão/área clicável que:
- Mostra o label da coluna.
- Mostra ícone `ArrowUp` quando crescente, `ArrowDown` quando decrescente, `ArrowUpDown` quando inativo.
- Alterna o estado a cada clique: inativo → asc → desc → inativo.

### 3. Ordenação dos registros
Aplicar no `useMemo` que produz `filtrados` (depois do filtro de busca):
- Se `sort.column` estiver ativo, ordenar os registros pela data da coluna selecionada.
- Valores nulos/vazios devem ficar sempre por último, tanto na ordem crescente quanto decrescente, para não sumirem no topo.
- Se inativo, manter a ordem original vinda do backend (UF + condomínio).

### 4. Regras de data
- Comparar as datas como objetos `Date` criados com `yyyy-MM-ddT00:00:00` para evitar deslocamento de fuso (padrão do projeto).
- Registrar nulos como valor inferior (sempre ao final).

### 5. Validação
- Rodar `npx tsgo --noEmit -p tsconfig.app.json` após as alterações.
- Verificar no preview se os cliques nos cabeçalhos alternam corretamente as setas e reordenam as linhas.

## Arquivos alterados
- `src/components/medicao-terceirizada/gti/GtiTab.tsx`

## Não alterar
- Backend / banco de dados.
- Lógica de importação, cálculo de prazos, exportação CSV ou regras de duplicidade.
