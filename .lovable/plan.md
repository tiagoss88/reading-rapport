## Objetivo

Na janela **Editar Serviço** (Serviços → ícone de editar), as fotos ainda aparecem misturadas dentro do campo Observação. Vamos criar uma seção própria de fotos, deixando a observação apenas com o texto.

## O que muda

**1. Nova seção "Fotos do Serviço" no formulário de edição**
- Miniaturas em grade das fotos já anexadas ao atendimento.
- Botão **Adicionar fotos** (várias de uma vez, com compressão automática antes do envio).
- Botão de remover (X) em cada miniatura.
- Clique na miniatura abre a imagem em tamanho real em nova aba.
- Quando não houver fotos: mensagem "Nenhuma foto anexada".

**2. Campo Observação passa a conter só texto**
- Ao abrir a edição, se o registro for antigo (links colados dentro da observação), o sistema separa automaticamente: os links viram miniaturas na nova seção e a observação exibe apenas o texto do técnico.
- Ao salvar, as fotos são gravadas no campo dedicado e a observação fica limpa — a correção do registro antigo é permanente.

**3. Consistência com o restante do sistema**
- Mesmo comportamento já usado na tela de Detalhes da Execução e no PDF de Relatório de Atendimento, que continuam mostrando todas as fotos.

## Detalhes técnicos

- Arquivo principal: `src/components/medicao-terceirizada/ServicoNacionalGasDialog.tsx`.
- Reaproveitar `src/lib/fotosServico.ts` (`resolverFotos`, `extrairTextoObservacao`) para ler o formato novo (`fotos_urls`) com fallback ao legado.
- Upload via bucket `medidor-fotos` usando `smartCompress` de `src/lib/imageCompression.ts` (mesmo padrão de `DetalhesExecucaoDialog`).
- Estado local `fotos: string[]` no diálogo; a mutação de salvar passa a enviar também `fotos_urls` junto com `observacao` (texto puro).
- Passar `fotos_urls` e `observacao` no objeto `servico` vindo de `src/pages/MedicaoTerceirizada/Servicos.tsx` (ajustar a interface `Props` do diálogo).
- Invalidar `servicos-nacional-gas` e `detalhes-execucao` após salvar.
