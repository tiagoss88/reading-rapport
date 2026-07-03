
## Problema

Ao digitar no campo de busca da tela **Medição Terceirizada → Serviços**, a página fica em branco (crash do React).

## Causa raiz

Em `src/pages/MedicaoTerceirizada/Servicos.tsx`, linha 140, o filtro chama:

```ts
servico.condominio_nome_original.toLowerCase().includes(...)
```

Sem optional chaining. As demais linhas (`morador_nome?.`, `apartamento?.`, `numero_protocolo?.`) já usam `?.`, mas essa não. Quando existe algum serviço com `condominio_nome_original` nulo ou vazio, o `.toLowerCase()` lança `TypeError: Cannot read properties of null`, derrubando a árvore de componentes e deixando a tela branca.

O bug só aparece ao digitar porque enquanto o campo está vazio o filtro nem sempre percorre todos os registros da mesma forma, mas ao mudar o `searchTerm` o React reavalia o filtro em cima de toda a lista.

## Correção

Arquivo: `src/pages/MedicaoTerceirizada/Servicos.tsx`

Trocar a linha 140 para usar optional chaining, igual às demais:

```ts
servico.condominio_nome_original?.toLowerCase().includes(searchTerm.toLowerCase()) ||
```

Nenhuma outra alteração é necessária. Sem mudanças de banco, RLS, edge functions ou lógica de negócio.

## Validação

- Abrir `/medicao-terceirizada/servicos`, digitar no campo de busca e confirmar que a lista filtra normalmente sem tela em branco.
