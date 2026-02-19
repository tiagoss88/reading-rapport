

## Corrigir validacao de senha - abordagem definitiva

### Problema
A correcao anterior com `.optional().or(z.literal(''))` nao esta funcionando como esperado na cadeia do Zod. O erro "Senha deve ter pelo menos 8 caracteres" persiste ao editar operadores.

### Solucao
Duas alteracoes complementares para garantir que funcione:

**1. Arquivo: `src/lib/validation.ts` (linha 29)**

Substituir a cadeia atual por um `z.union` explicito que e mais confiavel:

```typescript
password: z.union([
  z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha muito longa'),
  z.literal('')
]).optional(),
```

**2. Arquivo: `src/pages/Operadores.tsx` - funcao `handleSubmit`**

Adicionar limpeza do campo password antes da validacao: se estiver vazio, remover do objeto para que o schema receba `undefined` em vez de `""`:

```typescript
const dataToValidate = { ...formData };
if (!dataToValidate.password) {
  delete dataToValidate.password;
}
const validatedData = operadorSchema.parse(dataToValidate);
```

Esta segunda alteracao e a mais segura pois garante que o schema nunca receba uma string vazia no campo senha.
