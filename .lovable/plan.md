

## Destacar Nome do Operador Logado no Cronograma

### Objetivo

Na tela de Cronograma de Leitura (`/coletor/cronograma`), quando a lista de operadores designados para um condominio e exibida, o nome do operador que esta logado deve aparecer em **negrito**, facilitando a identificacao visual.

### Alteracoes

**Arquivo: `src/pages/ColetorCronograma.tsx`**

1. **Buscar o nome do operador logado**: Adicionar um `useQuery` que consulta `operadores` filtrando por `user_id` igual ao `user.id` do contexto de autenticacao (importar `useAuth`). Retorna o `nome` do operador.

2. **Renderizar com destaque**: Na linha 230-235, onde os nomes dos operadores sao exibidos com `operadores.join(', ')`, substituir por um mapeamento individual onde cada nome e comparado com o nome do operador logado. Se for igual, renderizar com `<span className="font-bold">`. Caso contrario, renderizar normalmente.

### Codigo resultante (trecho relevante)

```tsx
// Importar useAuth
import { useAuth } from '@/contexts/AuthContext'

// Dentro do componente, buscar nome do operador logado
const { user } = useAuth()

const { data: operadorLogado } = useQuery({
  queryKey: ['operador-logado', user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('operadores')
      .select('nome')
      .eq('user_id', user!.id)
      .maybeSingle()
    return data
  },
  enabled: !!user?.id
})

// Na renderizacao dos operadores (linha ~230-235)
{operadores.length > 0 ? (
  <span className="text-foreground">
    → {operadores.map((nome, i) => (
      <span key={i}>
        {i > 0 && ', '}
        <span className={nome === operadorLogado?.nome ? 'font-bold' : ''}>
          {nome}
        </span>
      </span>
    ))}
  </span>
) : (
  <span className="text-muted-foreground italic">→ Sem operador atribuído</span>
)}
```

### Resumo

- 1 arquivo alterado: `src/pages/ColetorCronograma.tsx`
- Adiciona query para buscar nome do operador logado (com cache automatico do React Query)
- Compara cada nome exibido com o do operador logado para aplicar `font-bold`

