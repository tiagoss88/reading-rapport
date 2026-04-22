
## Ajustar opções de Origem na importação de planilha

### Mudança

**Arquivo único:** `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx`

Substituir as opções atuais do `Select` de Origem (NGD / Síndico / Administradora / Outro) pelas três opções reais utilizadas:

- **NGD** (padrão — Nacional Gás Distribuidora)
- **BG**
- **Particular**

### Detalhes

1. Atualizar os `<SelectItem>` do passo `'origem'` para listar apenas: NGD, BG, Particular.
2. Remover a opção "Outro" e o `Input` condicional de texto livre (`origemCustomizada`), bem como o estado relacionado.
3. Simplificar `origemFinal` para usar diretamente `origemSelecionada` (não há mais texto customizado).
4. Manter NGD como valor default e o badge de confirmação na tela de Preview.
5. Resetar `origemSelecionada` para `'NGD'` em `handleClose`.

### Resultado

- Diálogo de importação mostra apenas as 3 origens reais do negócio.
- NGD continua como padrão de 1 clique para o caso mais comum.
- Sem campo de texto livre, eliminando inconsistências de digitação.

Nenhum schema, migration, edge function ou outro arquivo afetado.
