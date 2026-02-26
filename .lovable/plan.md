

## Reduzir Fonte Global e Espaçamento das Tabelas

### Problema

As tabelas do sistema estao com fonte grande e espaçamento excessivo entre linhas, ocupando muito espaço vertical.

### Alteracoes

**1. `src/index.css` — Reduzir fonte base global**

Adicionar `font-size: 14px` no `body` (em vez do padrao 16px do navegador). Isso afeta todo o projeto de forma consistente.

**2. `src/components/ui/table.tsx` — Reduzir padding das celulas**

- `TableHead`: reduzir de `h-12 px-4` para `h-9 px-3` (header mais compacto)
- `TableCell`: reduzir de `p-4` para `px-3 py-2` (menos espaço entre linhas)
- `Table`: adicionar `text-xs` em vez de `text-sm` para tabelas ainda mais compactas

**3. `src/components/ui/card.tsx` — Reduzir padding dos cards**

- Verificar e reduzir levemente o padding interno dos `CardHeader` e `CardContent` para manter consistencia com a fonte menor.

### Resultado

Todo o projeto fica com fonte ligeiramente menor e tabelas mais compactas, melhorando a densidade de informaçao e a responsividade.

