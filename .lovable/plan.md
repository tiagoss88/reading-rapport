
## Plano: Corrigir Erro ao Criar Operador com Email Já Existente

### Problema Identificado
O email `rafael@agasen.com.br` já existe na tabela `auth.users` (criado em 20/10/2025), mas **não possui registro correspondente na tabela `operadores`**. A edge function atual tenta criar um novo usuário no Auth e falha com o erro "email_exists".

### Evidência do Problema

| Tabela | Email | Status |
|--------|-------|--------|
| `auth.users` | rafael@agasen.com.br | Existe (id: e4aa6dc7-...) |
| `operadores` | rafael@agasen.com.br | Não existe |

---

### Solução

Atualizar a edge function `create-operador` para verificar se o usuário já existe no Auth antes de tentar criar. Se existir, usar o `user_id` existente para criar apenas o registro na tabela `operadores`.

### Alterações no Arquivo

**Arquivo:** `supabase/functions/create-operador/index.ts`

#### Lógica Atualizada

```text
1. Validar dados de entrada
2. Verificar se o email já existe no auth.users
   └─ Se SIM:
      ├─ Verificar se já existe registro em operadores
      │  └─ Se SIM: Retornar erro "Operador já existe"
      └─ Se NÃO existe em operadores:
         ├─ (Opcional) Atualizar senha do usuário existente
         └─ Criar registro na tabela operadores com user_id existente
   └─ Se NÃO:
      ├─ Criar usuário no Auth
      └─ Criar registro na tabela operadores
3. Retornar sucesso
```

#### Trecho de Código Principal

Antes da criação do usuário (linha ~101), adicionar verificação:

```typescript
// Verificar se o usuário já existe no Auth
const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
const existingUser = existingUsers?.users.find(u => u.email === email)

let userId: string

if (existingUser) {
  // Verificar se já existe um operador com esse user_id
  const { data: existingOperador } = await supabaseAdmin
    .from('operadores')
    .select('id')
    .eq('user_id', existingUser.id)
    .single()

  if (existingOperador) {
    return new Response(
      JSON.stringify({ error: 'Já existe um operador cadastrado com este email' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Atualizar senha do usuário existente
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    existingUser.id,
    { password, user_metadata: { nome } }
  )

  if (updateError) {
    throw updateError
  }

  userId = existingUser.id
  console.log(`Reutilizando usuário existente: ${userId}`)
} else {
  // Criar novo usuário no Auth
  const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome }
  })

  if (createAuthError) throw createAuthError
  if (!authData.user) throw new Error('Falha ao criar usuário')

  userId = authData.user.id
}

// Criar perfil do operador
const { error: operadorError } = await supabaseAdmin
  .from('operadores')
  .insert({
    user_id: userId,
    nome,
    email,
    status: status || 'ativo'
  })
```

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/create-operador/index.ts` | Adicionar verificação de usuário existente e reutilizar user_id |

### Comportamento Após Alteração

| Cenário | Comportamento |
|---------|---------------|
| Email não existe | Cria usuário Auth + operador (atual) |
| Email existe sem operador | Atualiza senha, cria operador |
| Email existe com operador | Retorna erro claro "Já existe operador com este email" |

### Benefícios

- Resolve o erro atual do Rafael
- Mensagens de erro mais claras para o usuário
- Permite "recuperar" usuários que existem no Auth mas não têm perfil de operador
