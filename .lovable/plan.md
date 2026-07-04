## Problema

Alguns serviços urgentes aparecem em "Sem geolocalização" mesmo depois de o condomínio já estar com lat/lng cadastrado, porque o serviço não tem `empreendimento_id` preenchido — o vínculo hoje depende só desse ID. O nome no serviço (`condominio_nome_original`) tem pequenas diferenças (acentos, espaços, prefixo "BA ", "Cond.", etc.) em relação ao nome cadastrado em `empreendimentos_terceirizados`, então uma comparação exata também falha.

## Correção

Adicionar um **fallback por nome normalizado** no `RoteirizarUrgentesDialog`, apenas para efeito de roteirização (não altera o banco):

1. Buscar de `empreendimentos_terceirizados` **todos** os condôminos com `latitude` e `longitude` preenchidos (id, nome, uf, latitude, longitude), não só os IDs presentes nos serviços.
2. Construir um índice por chave normalizada:
   - `lower()`, remover acentos (NFD), remover prefixo `BA `, remover pontuação, colapsar espaços.
   - Chave composta: `uf|nome_normalizado` para evitar match entre UFs diferentes.
3. Para cada serviço urgente:
   - 1º tenta pelo `empreendimento_id` (comportamento atual).
   - 2º, se não achou, tenta pela chave `uf|nome_normalizado`.
   - 3º, se ainda não achou, tenta match parcial: o nome do serviço "contém" ou "é contido" pelo nome do empreendimento (mesma UF).
4. Serviços que caírem no 2º/3º caminho entram normalmente na roteirização. Só ficam em "Sem geolocalização" os que realmente não têm correspondência.
5. Exibir um pequeno contador no rodapé do popup: "N serviços vinculados por nome" quando houver, para deixar claro que houve match aproximado.

## Fora do escopo

- Não alterar o schema, não gravar `empreendimento_id` de volta no serviço, não mexer no painel de urgências ou em outras telas. Se depois o usuário quiser um botão "Corrigir vínculos" que grave `empreendimento_id` nos serviços que casaram por nome, fazemos numa próxima etapa.

## Arquivos afetados

- `src/components/medicao-terceirizada/RoteirizarUrgentesDialog.tsx` — query passa a buscar por UF/coordenadas e adiciona o matcher por nome.
