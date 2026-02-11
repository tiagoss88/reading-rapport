

## Limpar Dashboard e Remover "Ordem de Servico" do Menu

### Resumo
Remover do Dashboard todas as informacoes relacionadas a leituras individuais (cards de estatisticas e tabela de leituras recentes), e remover a secao "Ordem de Servico" do menu lateral.

---

### Alteracoes

#### 1. Dashboard.tsx - Simplificar conteudo
**Remover:**
- Os 4 cards de estatisticas (Empreendimentos, Unidades, Leituras Hoje, Total Leituras)
- A tabela "Leituras Recentes" e toda a logica associada
- Interfaces `DashboardStats` e `LeituraRecente`
- Funcao `fetchDashboardData` e queries na tabela `leituras`
- Imports nao utilizados (Table, Badge, format, isToday, etc.)

**Manter:**
- Card do Coletor Mobile (acesso rapido ao coletor)
- Layout geral

**Adicionar (opcional):**
- Card com total de empreendimentos terceirizados (query em `empreendimentos_terceirizados`)
- Card com total de coletas confirmadas (query em `servicos_nacional_gas` com status = 'executado')

#### 2. Layout.tsx - Remover "Ordem de Servico"
**Remover:**
- Bloco "Ordem de Servico Dropdown" (linhas 143-179)
- Estado `servicosOpen` e `setServicosOpen`
- Array `servicosItems`

---

### Secao Tecnica

#### Dashboard.tsx
- Remover estados `stats`, `leiturasRecentes`, funcao `fetchDashboardData`, `getStatusBadge`
- Substituir os 4 cards + tabela por cards relevantes ao contexto terceirizado:
  - Total de empreendimentos terceirizados: `supabase.from('empreendimentos_terceirizados').select('*', { count: 'exact', head: true })`
  - Total de coletas confirmadas: `supabase.from('servicos_nacional_gas').select('*', { count: 'exact', head: true }).eq('status', 'executado')`
- Manter card do Coletor Mobile intacto

#### Layout.tsx
- Remover linhas 143-179 (bloco Ordem de Servico)
- Remover `servicosOpen` do useState (linha 31)
- Remover `servicosItems` (linhas 48-52)
- Remover import `Wrench` se nao for mais utilizado em outros itens (verificar `configuracoesItems` - ainda usa Wrench, entao manter)
