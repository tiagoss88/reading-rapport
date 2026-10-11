# Financeiro: deixar de considerar o tipo "leitura"

Serviços do tipo **leitura** vêm da nossa contratante, então não devem entrar
no controle financeiro: nem em Contas a receber, nem em Recebimentos, nem nos
resumos, nem na lista de inadimplência, nem nas exportações.

## Como vai funcionar

- O módulo Financeiro passa a ignorar automaticamente toda OS cujo tipo é
  leitura. Ela continua existindo normalmente em Serviços, no coletor, nos
  relatórios de serviços e no relatório de atendimento — só sai do Financeiro.
- O reconhecimento do tipo é tolerante a variações de escrita: maiúsculas,
  minúsculas, acentos e plural (ex.: "leitura", "Leitura", "LEITURA",
  "leituras") são tratados como o mesmo tipo. Assim a regra vale para as OS já
  cadastradas, independentemente de como o tipo foi digitado ou importado.
- Se um recebimento já tiver sido lançado em uma OS de leitura, ele também sai
  das listas e dos totais do Financeiro, para não aparecer valor que não é
  nosso para cobrar.
- Na tela de edição de uma OS de leitura, o bloco de situação financeira deixa
  de ser exibido (não há o que controlar).

## Onde a mudança aparece

- **Contas a receber**: totais (valor dos serviços, recebido, pendente, OS em
  aberto), a tabela e a exportação PDF/Excel/CSV passam a excluir leitura.
- **Recebimentos**: lista, total e exportação excluem leitura.
- **Resumo e relatórios**: por mês, por forma de pagamento, por UF, por técnico
  e inadimplência excluem leitura.
- **Serviços e demais telas**: nada muda.

## Detalhes técnicos

- A exclusão é feita na origem dos dados do módulo (`useFinanceiroDados`), em
  `src/hooks/useFinanceiro.ts`: a lista de OS consideradas monta as contas já
  sem o tipo leitura, usando comparação normalizada (caixa, acentos, plural)
  contra uma lista única de tipos ignorados, fácil de ampliar no futuro.
- Recebimentos cujo serviço não está mais na lista de contas ficam de fora das
  abas Recebimentos e Resumo, mantendo os totais coerentes.
- `src/components/financeiro/FinanceiroDaOsCard.tsx` deixa de renderizar quando
  o serviço é do tipo ignorado.
- Nenhuma alteração de banco de dados e nenhum script novo: é filtro no app.
- Verificação: abrir Operação > Financeiro, conferir que nenhuma OS de leitura
  aparece em Contas a receber e que os totais caem exatamente pela soma dessas
  OS; conferir também que uma OS de outro tipo continua normalmente listada e
  que a edição dela ainda mostra o bloco financeiro.

## A confirmar na primeira execução

- O valor exato gravado no campo de tipo das OS de leitura (a base que consigo
  consultar aqui está vazia e o tipo é texto livre, então a regra é feita para
  pegar as variações mais prováveis). Se aparecer alguma grafia diferente, ela
  entra na lista de ignorados na mesma hora.
