## Objetivo

Adicionar uma 4ª aba em `/medicao-terceirizada/leituras` chamada **"Relatório de Leitura"**, posicionada **após "Pendentes"**, que lista todas as coletas onde o técnico anexou fotos do relatório de leitura impresso (recurso recentemente adicionado no coletor).

## Onde os dados estão

Quando o técnico envia fotos do relatório no coletor, elas são salvas dentro do campo `observacao` da tabela `servicos_nacional_gas` no formato:

```
Fotos comprovante: [urls] | Fotos relatorio: [urls] | Obs: [texto]
```

Ou seja, a aba precisa listar registros de `servicos_nacional_gas` (tipo_servico = 'leitura', status = 'executado') cujo `observacao` contenha o marcador `Fotos relatorio:`.

## Mudanças (apenas em `src/pages/MedicaoTerceirizada/Leituras.tsx`)

### 1. TabsList
- Mudar `grid-cols-3` → `grid-cols-4`
- Adicionar 4º `TabsTrigger value="relatorios"` com ícone `FileImage` (lucide) e label **"Relatório de Leitura"**, após "Pendentes".

### 2. Helper
Adicionar função `extrairFotosRelatorio(observacao)` análoga ao `extrairFotosUrls` existente, mas casando o marcador `Fotos relatorio:` (com e sem colchetes).

### 3. Query / dados
Reutilizar a query `coletasRealizadas` já existente (mesmos filtros de competência) e derivar com `useMemo`:

```ts
const coletasComRelatorio = coletasRealizadas.filter(c =>
  /Fotos relatorio:/i.test(c.observacao || '')
)
```

Aplicar os mesmos filtros UF / Rota / busca por condomínio.

### 4. TabsContent "relatorios"
Card similar ao "Coletas Realizadas", com:

- **Filtros no header:** Competência, UF, Rota, busca por condomínio, itens por página (mesmos selects/inputs já criados — podem ser reutilizados controlando os mesmos estados).
- **Tabela:** Condomínio · UF · Rota · Técnico · Data da Coleta · **Fotos do Relatório** (miniaturas clicáveis abrindo em nova aba, como já é feito na coluna "Foto" da aba Realizadas) · Qtd Fotos.
- Estado vazio: "Nenhum relatório de leitura enviado nesta competência."

### 5. Sem mudanças de backend
Nenhuma migração, nenhuma alteração em RLS, nenhuma mudança no fluxo do coletor — apenas leitura/filtro da `observacao` já populada.

## Fora de escopo

- Não alterar como o coletor salva as fotos.
- Não criar tabela nova (continua dentro de `observacao`).
- Não mexer nas outras 3 abas existentes além de aumentar `grid-cols` para 4.
