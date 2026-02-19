

## Corrigir validacao de senha na edicao de operadores

### Problema
Ao editar um operador, o campo de senha nao aparece no formulario (correto), mas o `formData.password` e enviado como string vazia `""`. O schema Zod trata `""` como string presente e aplica a regra `min(8)`, gerando o erro "Senha deve ter pelo menos 8 caracteres".

### Solucao
Alterar o `operadorSchema` em `src/lib/validation.ts` para aceitar string vazia no campo password, tratando-a como ausencia de valor.

### Detalhes tecnicos

**Arquivo: `src/lib/validation.ts` (linha 29)**

Alterar de:
```typescript
password: z.string().min(8, '...').max(72, '...').optional(),
```
Para:
```typescript
password: z.string().min(8, '...').max(72, '...').optional().or(z.literal('')),
```

Isso faz com que `""` seja aceito sem disparar a validacao de tamanho minimo, mantendo a validacao para senhas reais (novo operador).

