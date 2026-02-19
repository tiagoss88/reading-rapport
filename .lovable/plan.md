

## Corrigir autocomplete do campo Condominio

### Problema
O autocomplete ja esta no mesmo campo "Condominio", mas tem dois problemas:
1. `useMemo` esta sendo chamado dentro do render callback do FormField, violando as regras de hooks do React (pode causar erro ou nao funcionar)
2. O placeholder mudou de "Nome do condominio" para "Digite para buscar ou cadastrar novo..." dando impressao de campo diferente

### Solucao

**Arquivo: `src/components/medicao-terceirizada/NovoServicoNacionalGasDialog.tsx`**

1. Mover a logica de filtragem para fora do render callback, usando um estado separado para o texto digitado e calculando os filtrados no nivel do componente
2. Restaurar o placeholder original "Nome do condominio"
3. Fechar o dropdown quando o input perde foco (onBlur)
4. Manter a mesma aparencia visual do dropdown com sugestoes abaixo do campo

Alteracoes especificas:
- Adicionar estado `condominioSearch` para rastrear o texto digitado
- Calcular `filteredCondominios` com `useMemo` no nivel do componente (fora do render)
- No campo Input: manter placeholder "Nome do condomínio", ao digitar filtrar e mostrar sugestoes
- No onBlur: fechar dropdown com pequeno delay para permitir click na sugestao

