# Manter a assinatura do cliente na primeira página

## Ajuste
- Reorganizar o cálculo de espaço do Relatório de Atendimento para reservar, desde o início, a área completa das assinaturas na primeira página.
- Compactar somente os espaçamentos verticais do conteúdo principal quando necessário, sem remover campos, valores ou informações.
- Fazer a observação do técnico usar o espaço restante antes das assinaturas; se um texto excepcionalmente longo não couber, continuar apenas o excedente na página seguinte, sem truncar o conteúdo.
- Manter a assinatura do cliente e a identificação do responsável técnico juntas na primeira página.
- Eliminar a página quase vazia que atualmente contém apenas as assinaturas; o anexo fotográfico começará na página seguinte quando não houver conteúdo excedente.

## Validação
- Gerar novamente um relatório com os mesmos dados do PDF enviado e confirmar visualmente que:
  - a assinatura do cliente aparece na página 1;
  - nenhum texto, campo, assinatura ou foto foi perdido;
  - não há sobreposição nem corte próximo ao rodapé;
  - a numeração “Página X de Y” reflete a nova quantidade de páginas;
  - as fotos continuam em grade nas páginas de anexo.
- Conferir também um caso com observação longa para garantir que o texto continue em outra página sem empurrar a assinatura para fora da primeira.

## Detalhes técnicos
- Alterar somente o gerador do PDF do Relatório de Atendimento.
- Substituir a quebra automática aplicada antes do bloco de assinaturas por uma reserva explícita de espaço na página 1 e paginação controlada da observação.
- Não alterar dados, regras do atendimento, fotos, protocolos, valores, assinaturas ou telas do sistema.
