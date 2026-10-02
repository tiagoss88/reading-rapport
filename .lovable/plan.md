# Mostrar os materiais usados na tela de edição da OS

## O que muda para você
Na tela **Editar Serviço** (a que está aberta, MARES DE ALAH), entra um bloco **Materiais utilizados**, logo abaixo das observações e acima das fotos:

- lista cada material que saiu do estoque para essa OS, com a quantidade e a unidade (ex.: "Registro de gás - 2 un");
- mostra de qual armazém saiu e quando foi registrado;
- se o técnico marcou "Nenhum material utilizado", aparece essa informação;
- se nada foi registrado, aparece "Nenhum material registrado para esta OS";
- o bloco é só para consulta. Para corrigir algo, continua valendo **Operação > Estoque > Baixa por serviço**, onde o aviso de "já saiu material para esta OS" evita baixa em dobro.

O mesmo bloco também aparece na tela de **Detalhes da execução**, para você ver os itens sem abrir a edição.

## Regras
- Só administradores veem o bloco, porque o estoque é restrito a eles. Para os demais, ele não aparece.
- Se o Estoque ainda não estiver instalado no banco, o bloco simplesmente não aparece. Nada quebra.
- Não precisa de script novo no banco: os dados já são gravados pelo coletor e pela baixa manual.

## Detalhes técnicos
- Novo `src/components/medicao-terceirizada/MateriaisDaOsCard.tsx`, somente leitura, dentro de `ErrorBoundary`.
- Consulta `estoque_movimentacoes` filtrando por `servico_id` e `tipo = 'saida'`, trazendo nome e unidade do material e nome do armazém. Usa `sbEstoque` (cliente sem tipos) e `isTabelaAusente` de `useEstoque.ts`; se a tabela estiver ausente, retorna `null`.
- Consulta `estoque_os_sem_material` pelo `servico_id` para exibir "Nenhum material utilizado" (ausência da tabela é ignorada).
- Visibilidade: `usePermissions().isAdmin`.
- Encaixe em `ServicoNacionalGasDialog.tsx` (entre o campo de observação do técnico e o bloco de fotos) e em `DetalhesExecucaoDialog.tsx`.
- Atualização: react-query com chave `['os-materiais', servicoId]`, invalidada ao fechar/reabrir o diálogo (`staleTime` curto).
