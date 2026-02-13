

## Melhorias no Coletor de Leituras Terceirizadas

### Alteracao 1 - Busca por nome do empreendimento

Adicionar um campo de busca por texto na pagina `ColetorLeiturasTerceirizadas.tsx` que permite ao operador encontrar um empreendimento digitando o nome, sem precisar saber a UF ou Rota.

**Como vai funcionar:**
- Um campo de pesquisa aparece no topo, acima dos filtros de UF/Rota
- Ao digitar pelo menos 3 caracteres, o sistema busca diretamente no banco por empreendimentos cujo nome contenha o texto digitado (busca `ilike`)
- Os resultados aparecem na lista, substituindo temporariamente o filtro por UF/Rota
- Ao limpar a busca, volta ao modo de filtro normal por UF e Rota
- Icone de busca (Search) no campo para deixar claro a funcionalidade

### Alteracao 2 - Upload de imagem da galeria

Na pagina `ColetorEmpreendimentoDetalhe.tsx`, o input de foto ja aceita arquivos da galeria tecnicamente, pois usa `accept="image/*"`. Porem o atributo `capture="environment"` forca a abertura da camera em alguns dispositivos moveis.

**Solucao:**
- Remover o atributo `capture="environment"` do input existente
- Substituir o botao unico por dois botoes separados:
  - **"Tirar Foto"** - abre a camera (usa um segundo input com `capture="environment"`)
  - **"Galeria"** - abre a galeria de imagens (usa o input sem capture)
- Ambos os botoes alimentam o mesmo estado de foto/preview
- Layout lado a lado para facil acesso

---

### Detalhes tecnicos

**Arquivo 1: `src/pages/ColetorLeiturasTerceirizadas.tsx`**
- Adicionar estado `searchTerm` e input de busca com icone `Search`
- Nova query condicional: quando `searchTerm.length >= 3`, buscar com `.ilike('nome', '%termo%')` ignorando filtros de UF/Rota
- Quando busca esta ativa, esconder selects de UF/Rota e mostrar resultados da busca
- Botao para limpar busca e voltar ao modo filtro

**Arquivo 2: `src/pages/ColetorEmpreendimentoDetalhe.tsx`**
- Adicionar segundo `ref` para o input da camera (`cameraInputRef`)
- Input da camera: `accept="image/*" capture="environment"`
- Input da galeria: `accept="image/*"` (sem capture)
- Substituir o botao unico de foto por dois botoes lado a lado: "Tirar Foto" (icone Camera) e "Galeria" (icone ImagePlus/Upload)
- Ambos chamam o mesmo `handleFotoCapture`

