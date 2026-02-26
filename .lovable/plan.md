

## Reduzir Fonte e Espaçamento na Pagina de Empreendimentos

O `CardTitle` global esta com `text-2xl` que e grande para o design compacto do sistema. Vou reduzi-lo globalmente para `text-lg`.

### Alteracoes

**1. `src/components/ui/card.tsx` — Reduzir tamanho do CardTitle**
- Alterar `text-2xl` para `text-lg` na classe do `CardTitle`

**2. `src/pages/MedicaoTerceirizada/Empreendimentos.tsx` — Ajustes especificos**
- Verificar se ha espacamentos extras ou fontes grandes especificas nesta pagina e compactar

