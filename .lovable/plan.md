# Fotos do atendimento: 4 enviadas, só 2 aparecem

## Situação

As 4 fotos foram anexadas pela tela de detalhes do atendimento (no computador) e nenhum aviso de erro apareceu, mas só 2 ficaram salvas — tanto na tela quanto no PDF.

Não consigo confirmar a causa exata olhando os dados desse atendimento (a base usada pelo sistema em produção não é a mesma que consigo consultar aqui). Analisando o código de envio, existem duas falhas reais que produzem exatamente esse sintoma, e as duas serão corrigidas:

1. **Envio em rodadas sobrescreve as anteriores.** Ao salvar, o sistema usa a lista de fotos que está na tela naquele instante. Se um segundo envio começa antes de a tela terminar de atualizar, as fotos do primeiro envio somem da conta e são substituídas.
2. **Falhas de envio ficam silenciosas em parte do fluxo.** Se uma foto não sobe (arquivo grande, nome repetido, conexão), o sistema pode simplesmente ignorá-la sem avisar quantas realmente foram salvas.

## O que será feito

- Antes de gravar, o sistema relê no banco as fotos já existentes do atendimento e soma as novas, em vez de confiar no que está na tela. Fotos repetidas são descartadas.
- Cada foto passa a ser enviada com nome garantidamente único, evitando conflito quando dois arquivos têm o mesmo nome.
- Se alguma foto falhar, as que deram certo são salvas mesmo assim e aparece um aviso claro: "3 de 4 fotos enviadas — falhou: nome-do-arquivo.jpg".
- Depois de salvar, o sistema confere quantas fotos ficaram gravadas e avisa se o número for diferente do esperado.
- Mesma proteção no envio feito pelo celular, no coletor, onde hoje uma falha de envio é descartada em silêncio.
- Botão de envio bloqueado enquanto um envio está em andamento, para não iniciar uma segunda rodada por cima da primeira.

Nada muda no que já está salvo, nem no PDF, nas assinaturas, nos protocolos ou nos demais campos. O PDF volta a mostrar todas as fotos porque ele usa a mesma lista corrigida.

## Como verificar

Depois da correção, reenviar as 2 fotos que faltam no atendimento do Luchino e conferir que a tela mostra "Registro Fotográfico (4)" e que o PDF traz as 4 imagens.

## Detalhes técnicos

- `src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx`: `handleUploadFotos` deixa de usar `fotos` derivado do cache; passa a fazer um `select fotos_urls` fresco antes do update, concatena e deduplica; erros por arquivo são coletados em vez de `throw` global; `path` de upload com `crypto.randomUUID()` e extensão preservada.
- `src/lib/fotosServico.ts`: nova função para anexar fotos lendo o estado atual do registro (leitura + merge + update), reutilizada pelos dois fluxos, mantendo o fallback legado de `observacao`.
- `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`: `uploadFile` passa a reportar falhas; `handleSubmit` avisa quantas fotos foram salvas e quais falharam.
- Sem alterações de banco, RLS ou storage.
