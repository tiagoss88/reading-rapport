

## Duas alteracoes a implementar

### 1. Registrar tecnico e turno ao executar servico

**Arquivo: `src/pages/ColetorServicosTerceirizados.tsx`**

Na funcao `updateStatus` (linha 118), ao atualizar o status para "executado", incluir tambem:
- `tecnico_id`: usando o `operadorId` ja disponivel no estado do componente
- `turno`: determinado automaticamente - se hora atual < 12, "manha"; senao, "tarde"

O update passara de:
```
.update({ status_atendimento: novoStatus })
```
Para:
```
.update({
  status_atendimento: novoStatus,
  ...(novoStatus === 'executado' && {
    tecnico_id: operadorId,
    turno: new Date().getHours() < 12 ? 'manha' : 'tarde'
  })
})
```

### 2. Permitir edicao de email de operadores pela interface

**Arquivo: `src/pages/Operadores.tsx`**

- Remover o `disabled={!!editingOperador}` do campo de email no formulario de edicao, permitindo alterar o email

**Arquivo: `supabase/functions/create-operador/index.ts`** (ou nova edge function)

- Criar logica para que, ao editar um operador, se o email mudar, tambem atualize o email no Supabase Auth usando `supabase.auth.admin.updateUserById(user_id, { email: novoEmail })`

**Arquivo: `src/pages/Operadores.tsx`** - funcao `handleSubmit`

- Na branch de edicao, se o email mudou em relacao ao `editingOperador.email`, chamar uma edge function que atualize tanto a tabela `operadores` quanto o Auth
- Pode-se reutilizar a edge function existente ou criar uma nova `update-operador-email`

### Sobre a alteracao do Cristian Muler

Apos implementar a edicao de email pela interface, voce podera alterar o email do Cristian diretamente pelo sistema. Enquanto isso, a alteracao pode ser feita manualmente no Supabase Dashboard (Authentication > Users) e via SQL na tabela operadores.

