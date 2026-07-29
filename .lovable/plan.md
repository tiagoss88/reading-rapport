## Causa confirmada

A requisição de salvamento (PATCH em `servicos_nacional_gas`) voltou com erro **400**:

```text
PGRST204 — Could not find the 'fotos_urls' column of 'servicos_nacional_gas' in the schema cache
```

Ou seja: o banco que o app usa em produção (`mxoflglq...`) **não tem a coluna `fotos_urls`**. A migração de fotos foi aplicada apenas no banco gerenciado do Lovable; a produção exige SQL manual (conforme já registrado no projeto). Por isso a janela "Editar Serviço" mostra as fotos (lidas do formato legado dentro da observação), mas falha ao salvar.

## O que fazer

**1. Criar a coluna no banco de produção (SQL manual, executado por você no SQL Editor)**

```sql
ALTER TABLE public.servicos_nacional_gas
  ADD COLUMN IF NOT EXISTS fotos_urls text[] NOT NULL DEFAULT '{}';

-- migra os links que hoje estão dentro da observação
UPDATE public.servicos_nacional_gas
SET fotos_urls = ARRAY(
      SELECT (regexp_matches(observacao, '(https?://[^\s,|\])]+)', 'g'))[1]
    ),
    observacao = NULLIF(TRIM(COALESCE(
      (regexp_match(observacao, '\|\s*Obs:\s*([\s\S]*)$'))[1], ''
    )), '')
WHERE observacao ~* 'fotos?\s+comprovante';

NOTIFY pgrst, 'reload schema';
```

**2. Tornar o app resistente a essa situação (código)**

- Em `ServicoNacionalGasDialog.tsx`: se o update falhar com `PGRST204`/coluna inexistente, refazer o salvamento **sem** `fotos_urls`, gravando as fotos no formato legado dentro de `observacao` (`Fotos comprovante: url1, url2 | Obs: texto`). Assim nada se perde antes da migração.
- Exibir no toast a mensagem real do erro (hoje mostra só "Erro ao atualizar serviço"), facilitando diagnóstico futuro.
- Aplicar o mesmo fallback em `DetalhesExecucaoDialog.tsx` e `ExecucaoServicoTerceirizado.tsx`, que gravam `fotos_urls` pelos mesmos caminhos.

## Detalhes técnicos

- Centralizar o fallback em `src/lib/fotosServico.ts` com um helper `montarObservacaoLegado(fotos, texto)` e um `updateServicoComFotos(id, payload, fotos)` que tenta a coluna nova e cai para o legado ao detectar `PGRST204`.
- Nenhuma mudança de layout: a seção "Fotos do Serviço" continua igual.
- Depois que o SQL do passo 1 rodar em produção, o fallback deixa de ser acionado automaticamente — não precisa remover nada.
