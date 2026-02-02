
## Plano: Permitir que Todos os Operadores Vejam Todos os Serviços Terceirizados

### Objetivo
Alterar o sistema para que qualquer operador autenticado possa visualizar todos os serviços terceirizados pendentes/agendados, independentemente de a quem estejam atribuídos.

---

### Alterações Necessárias

#### 1. Migração SQL - Nova Política RLS

Criar política que permite qualquer operador ver todos os serviços:

```sql
-- Permitir operadores verem TODOS os serviços terceirizados
CREATE POLICY "Operadores podem ver todos os servicos"
ON public.servicos_nacional_gas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM operadores 
    WHERE user_id = auth.uid()
  )
);

-- Permitir operadores atualizarem qualquer serviço
CREATE POLICY "Operadores podem atualizar servicos"
ON public.servicos_nacional_gas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM operadores 
    WHERE user_id = auth.uid()
  )
);
```

#### 2. Alterar o Código do Coletor

**Arquivo:** `src/pages/ColetorServicosTerceirizados.tsx`

Remover o filtro por `tecnico_id` na query (linha 85):

**Antes:**
```typescript
const { data, error } = await supabase
  .from('servicos_nacional_gas')
  .select(`...`)
  .eq('tecnico_id', operadorId)  // ← Filtro a ser removido
  .in('status_atendimento', ['pendente', 'agendado'])
```

**Depois:**
```typescript
const { data, error } = await supabase
  .from('servicos_nacional_gas')
  .select(`...`)
  // Sem filtro por tecnico_id - mostra todos
  .in('status_atendimento', ['pendente', 'agendado'])
```

#### 3. Atualizar textos da interface

Atualizar a descrição na tela para refletir que são todos os serviços:

**Antes (linha 188-189):**
```tsx
<p className="text-sm text-gray-600">
  Serviços da Nacional Gás agendados para você
</p>
```

**Depois:**
```tsx
<p className="text-sm text-gray-600">
  Todos os serviços da Nacional Gás
</p>
```

---

### Resumo das Alterações

| Tipo | Arquivo/Recurso | Alteração |
|------|-----------------|-----------|
| Migração SQL | Banco de dados | Adicionar 2 políticas RLS para operadores (SELECT e UPDATE) |
| Código | `ColetorServicosTerceirizados.tsx` | Remover `.eq('tecnico_id', operadorId)` da query |
| Código | `ColetorServicosTerceirizados.tsx` | Atualizar texto descritivo |

### Comportamento Após Alteração

- ✅ Todos os operadores verão todos os serviços pendentes/agendados
- ✅ Qualquer operador pode marcar um serviço como executado
- ✅ Serviços executados ou cancelados continuam ocultos da lista
