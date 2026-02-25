

## Refinamento Visual do Menu do Coletor

### Problema

Os cards do menu possuem padding excessivo (p-6 herdado do CardHeader/CardContent), proporções inconsistentes, e o click handler esta dividido entre Card e CardHeader em alguns casos, causando areas mortas ao toque.

### Alteracoes

**Arquivo: `src/pages/ColetorMenu.tsx`**

1. **Cards compactos e uniformes**: Reduzir padding dos cards usando `p-4` no CardHeader e remover o CardContent secundario (a linha descritiva extra nao agrega muito e alonga os cards desnecessariamente).

2. **Click handler consistente**: Mover o `onClick` para o `Card` em todos os tres itens (atualmente "Leituras" e "Servicos" tem o onClick no CardHeader, criando area morta no CardContent).

3. **Icones proporcionais**: Reduzir o container do icone de `w-12 h-12` para `w-10 h-10` e os icones de `w-6 h-6` para `w-5 h-5`, alinhando com o header.

4. **Tipografia ajustada**: CardTitle de `text-lg` para `text-base font-semibold`, e CardDescription com `text-xs` para manter hierarquia sem ocupar tanto espaco vertical.

5. **Espacamento entre cards**: Reduzir de `space-y-4` para `space-y-3`.

6. **Chevron indicador**: Adicionar um `ChevronRight` discreto no lado direito de cada card para indicar navegabilidade.

### Layout resultante

```text
┌──────────────────────────────────┐
│ 👤 Menu Principal        [logout]│
│    operador@email.com            │
├──────────────────────────────────┤
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📅 Cronograma de Leitura  > │ │
│ │    Planejamento das rotas    │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 📖 Confirmação de Leituras > │ │
│ │    Upload dos comprovantes   │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 🏢 Serviços               > │ │
│ │    Visualizar e executar     │ │
│ └──────────────────────────────┘ │
│                                  │
│   Sistema de Gestão de Gás       │
│         v1.0 - Modo Coletor      │
└──────────────────────────────────┘
```

### Resumo das mudancas

- Remover `CardContent` dos tres cards (elimina a segunda linha descritiva redundante)
- Unificar `onClick` no elemento `Card`
- Ajustar tamanhos de icone, fonte e padding
- Adicionar `ChevronRight` como indicador visual
- Reduzir espacamento entre cards

Todas as alteracoes em um unico arquivo: `src/pages/ColetorMenu.tsx`.

