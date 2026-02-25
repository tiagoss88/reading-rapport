

## Novo Relatório: Cadastro de Condomínios por UF

### Objetivo

Adicionar um terceiro tipo de relatório na categoria "Leituras" que lista todos os condomínios cadastrados na tabela `empreendimentos_terceirizados`, agrupados por UF, em ordem alfabética, mostrando a rota e o quantitativo de medidores. O relatório incluirá um totalizador por UF e geral.

### Fonte de dados

Tabela `empreendimentos_terceirizados` com os campos: `nome`, `uf`, `rota`, `quantidade_medidores`. Não depende de competência nem de datas -- é um retrato cadastral.

### Alterações necessárias

**1. `src/pages/Relatorios.tsx`**
- Adicionar `'cadastro_condominios_uf'` ao tipo `TipoRelatorio`.

**2. `src/components/relatorios/RelatorioSelector.tsx`**
- Adicionar nova opção na categoria "Leituras": `{ value: 'cadastro_condominios_uf', label: 'Cadastro de Condomínios por UF' }`.

**3. Novo hook: `src/hooks/useRelatorioCadastroCondominios.tsx`**
- Consulta `empreendimentos_terceirizados` sem filtro de data.
- Filtro opcional por UF (selecionável nos filtros).
- Retorna array ordenado por UF e depois nome (alfabético), com campos: `condominio`, `uf`, `rota`, `qtd_medidores`.
- Inclui linha de subtotal por UF (total de condomínios e total de medidores).

**4. `src/components/relatorios/FiltrosRelatorio.tsx`**
- Para `cadastro_condominios_uf`: exibir apenas filtro de UF (select com as UFs disponíveis no banco). Sem filtros de data/competência.

**5. `src/components/relatorios/TabelaRelatorio.tsx`**
- Novo case `cadastro_condominios_uf` com colunas: **Condomínio | UF | Rota | Qtd Medidores**.
- Linhas de subtotal por UF destacadas (fundo cinza, texto em negrito).
- Linha final com total geral de condomínios e medidores.

**6. Exportações (PDF, Excel, CSV)**
- `src/lib/exportPDF.ts`: novo case com colunas e título "Cadastro de Condomínios por UF".
- `src/lib/exportCSV.ts`: novo case.
- `src/components/relatorios/ExportacaoButtons.tsx`: novo case na função `exportarExcel`.

### Estrutura dos dados retornados

```text
{ condominio: string, uf: string, rota: number, qtd_medidores: number, is_subtotal?: boolean }
```

Linhas com `is_subtotal: true` representam totais por UF e serão renderizadas com estilo diferenciado na tabela e incluídas nas exportações.

### Exemplo visual da tabela

```text
Condomínio               | UF | Rota | Qtd Medidores
─────────────────────────┼────┼──────┼──────────────
ABOLIÇÃO                 | CE |  18  |    45
ABARANA                  | CE |   2  |    32
...
Subtotal CE (185 cond.)  | CE |  --  |  4.520
─────────────────────────┼────┼──────┼──────────────
COND. EXEMPLO SP         | SP |   1  |    20
...
Subtotal SP (10 cond.)   | SP |  --  |   310
─────────────────────────┼────┼──────┼──────────────
TOTAL GERAL (195 cond.)  |    |  --  |  4.830
```

