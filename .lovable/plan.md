# Novo layout do Relatório de Atendimento (PDF)

Refazer a aparência do PDF "Relatório de Atendimento" seguindo o modelo enviado, sem mudar nenhum dado, campo, foto, assinatura ou protocolo. Só muda a apresentação.

## Como o documento vai ficar

**Página 1**
- Cabeçalho: logo oficial da Agasen à esquerda (arquivo já existente no sistema), "RELATÓRIO DE ATENDIMENTO" à direita, data/hora de emissão abaixo e o protocolo num selo azul-claro discreto. Faixa fina em degradê azul-marinho → azul → ciano no topo da página.
- Bloco de destaque: tipo de serviço em letras pequenas, nome do condomínio grande em azul-marinho e, ao lado, Unidade / Estado / Data / Turno.
- Seções numeradas (01, 02, 03, 04) com título em caixa alta e linha fina:
  - 01 Dados do Atendimento — condomínio, unidade (bloco/apto), estado, data de agendamento, turno.
  - 02 Dados do Cliente — cliente, telefone, e-mail, CPF/CNPJ.
  - 03 Pagamento e Cadastro — forma de pagamento e documento em cartões brancos, e o **Valor do Serviço** num cartão azul-marinho com o número em destaque (dinâmico).
  - 04 Assinaturas — dois espaços lado a lado, com a assinatura real do cliente exibida por cima da linha, sem distorcer (proporção preservada), e o nome do responsável técnico.
- A observação do técnico, quando existir, aparece como nota lateral com barra azul.
- Rodapé: "AGASEN • Instalações e Serviços em Gás" à esquerda, protocolo e "Página X de Y" à direita.

**Páginas de fotos**
- Mesmo cabeçalho e rodapé, título "ANEXO FOTOGRÁFICO" e protocolo visível.
- 4 fotos por página em grade 2x2; com 1 ou 2 fotos, elas crescem para ocupar bem a página.
- Cada foto com moldura fina, cantos arredondados, proporção original preservada (sem cortar/esticar) e legenda "Registro 01", "Registro 02"...
- Fotos nunca partidas entre páginas; novas páginas são criadas automaticamente mantendo o padrão.

## Detalhes técnicos

- Reescrever `src/lib/exportRegistroAtendimento.ts` mantendo a mesma assinatura da função e o mesmo objeto `RegistroAtendimentoData` — nenhuma alteração em `DetalhesExecucaoDialog.tsx` nem na consulta de dados.
- Continuar com jsPDF em A4 (mm), desenhando os cartões via `roundedRect`, agora com a paleta do modelo: navy `#10253f`, azul `#0877c9`, ciano `#31b7e8`, linhas `#dfe6ee`, fundo suave `#f4f7fa`.
- Logo: importar `src/assets/agasen-logo.png` e inserir com `addImage`, respeitando a proporção; se falhar o carregamento, cair para o selo "A" com o nome AGASEN.
- Helpers novos: `drawCard(label, value, x, y, w)` com altura calculada por `splitTextToSize`, `drawSectionHead(num, title)`, `drawAmountCard`, `drawSignatureArea`, além do controle de quebra de página (`checkPageBreak`) já existente, ampliado para nunca deixar título de seção órfão.
- Imagens (assinatura e fotos): ler dimensões com `doc.getImageProperties` para calcular altura proporcional dentro do quadro (contain), sem `object-fit` forçado.
- Rodapé/`Página X de Y` aplicado no fim, iterando as páginas, como já é feito hoje.
- Tipografia: Helvetica (fonte padrão do jsPDF, sem-serifa) com a hierarquia de tamanhos do modelo; nenhuma fonte externa é embutida para não aumentar o pacote.
- Nenhuma mudança de dados, consulta, protocolo ou regra de negócio.
