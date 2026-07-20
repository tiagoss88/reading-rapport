## Diagnóstico

A busca em `/medicao-terceirizada/servicos` filtra **em memória** a lista carregada pelo React Query. A consulta atual é:

```ts
supabase
  .from('servicos_nacional_gas')
  .select('*, empreendimento:..., tecnico:...')
  .order('created_at', { ascending: false })
```

Sem `.range()`/`.limit()`, o PostgREST do Supabase aplica o **teto padrão de 1000 linhas**. Como a tabela já tem mais de 1000 serviços, apenas os 1000 mais recentes chegam ao front-end. Os serviços mais antigos do ANHEMBI ficam de fora do array, então a busca por "anhembi" mostra só 2 em vez dos 8+ que existem no banco.

O mesmo problema afeta qualquer busca/filtro nessa tela (UF, status, tipo, protocolo) — todos operam sobre o mesmo array truncado.

Obs.: não consegui confirmar a contagem por SQL porque o backend acessível via ferramenta está vazio; o diagnóstico é baseado no código e no teto documentado do PostgREST, que explica exatamente o sintoma relatado.

## Correção

**`src/pages/MedicaoTerceirizada/Servicos.tsx`** — trocar o `select` único por um **loop de paginação** que traz todos os registros em lotes de 1000 usando `.range(from, to)`, até esgotar:

```ts
const pageSize = 1000
let from = 0
const all: ServicoNacionalGas[] = []
while (true) {
  const { data, error } = await supabase
    .from('servicos_nacional_gas')
    .select('*, empreendimento:empreendimentos_terceirizados(nome,endereco,rota), tecnico:operadores(nome)')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
  if (error) throw error
  all.push(...(data as ServicoNacionalGas[]))
  if (!data || data.length < pageSize) break
  from += pageSize
}
return all
```

Nenhuma outra tela precisa mudar agora — o coletor (`ColetorServicosTerceirizados`) filtra por `status_atendimento in ('pendente','agendado')`, o que naturalmente mantém o conjunto pequeno; se um dia estourar 1000, aplicamos o mesmo padrão lá.

## Resultado esperado

- A lista completa de serviços é carregada (em lotes), então buscar "anhembi" retorna todos os 8+ registros, incluindo os 3 do Bloco A Apto 303.
- Filtros por UF, status, tipo e protocolo passam a refletir a base inteira.
- Custo: um request extra a cada 1000 registros no carregamento inicial da página (aceitável; a query já é cacheada pelo React Query).