## Problema

A detecção atual (em `ImportarPlanilhaDialog.tsx`) marca como duplicado **qualquer** registro que bata só por unidade física (UF + condomínio + bloco + apto), ignorando morador e tipo de serviço quando há bloco/apto preenchidos.

Trecho responsável (linhas 163-179):
```ts
const isDuplicate =
  existingFullKeys.has(fullKey) ||
  seenFull.has(fullKey) ||
  (hasUnit && (existingUnitKeys.has(unitKey) || seenUnit.has(unitKey)))
```

Resultado: VARANDAS DO IMBUI 602 é marcado como duplicado mesmo com morador diferente e tipo de serviço diferente, porque já existe outro serviço naquela mesma unidade.

Isso foi introduzido para resolver o caso oposto (Sonata B 302 / Barcelona ÚNICO 404), mas ficou agressivo demais — uma mesma unidade pode legitimamente ter vários serviços ao longo do tempo (religação, desligamento, vistoria, troca de medidor, etc.) e/ou trocar de morador.

## Correção proposta

Reformular a chave de duplicidade para considerar **tipo de serviço** e **morador**, mantendo as normalizações atuais.

### Nova regra de duplicidade

Um registro é duplicado quando bate **tudo** isto com um existente (ou outro da mesma planilha):

- UF
- Condomínio (normalizado: sem acento, sem `(GTI)/(FS)`, sem prefixo `BA `)
- Bloco (normalizado, `unico`/`u`/vazio equivalentes)
- Apartamento (normalizado, sem zeros à esquerda)
- **Tipo de serviço** (normalizado)
- **Morador** (normalizado)

Ou seja: mesma unidade + mesmo serviço + mesmo morador = duplicado. Qualquer um desses três últimos diferindo → não é duplicado.

### Tratamento do morador vazio

Para não voltar ao problema antigo (Sonata B 302 vinha sem morador e passava batido):

- Se o morador estiver vazio nos **dois lados** (importado e existente) e o tipo de serviço for o mesmo → considerar duplicado (não dá para distinguir).
- Se um lado tem morador e o outro não → **não** duplicado (tratar como registro novo, deixa o usuário decidir).

### Mudanças no código

Arquivo único: `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx`

1. Substituir `makeDuplicateKey` para incluir `tipo_servico` normalizado:
   ```ts
   makeUnitKey(row) + '|' + normText(row.tipo_servico) + '|' + normText(row.morador_nome)
   ```

2. Ajustar a busca em `existingServices` para também trazer `tipo_servico` (`select('uf, condominio_nome_original, bloco, apartamento, morador_nome, tipo_servico')`).

3. Em `markDuplicates`, remover o fallback por `unitKey` puro. Usar apenas `existingFullKeys` / `seenFull` com a nova chave (que já inclui tipo + morador).

4. Invalidar a query `servicos-nacional-gas-duplicates` ao abrir o dialog (ou manter `enabled: open` + `staleTime: 0`) para garantir dados frescos.

5. Atualizar o comentário/cabeçalho explicando a nova regra.

Não há mudança de banco, RLS, UI ou outros componentes.

### Validação mental

- VARANDAS DO IMBUI 602, morador A, "Religação" + já existe morador B, "Vistoria" → tipo diferente E morador diferente → **não** duplicado. ✓
- Sonata B 302 sem morador na planilha + já existe sem morador, mesmo tipo → duplicado. ✓
- Reimportar a mesma planilha duas vezes → duplicado (tudo bate). ✓
- Mesma unidade, mesmo morador, tipo diferente (ex.: "Religação" hoje, "Desligamento" amanhã) → **não** duplicado. ✓
