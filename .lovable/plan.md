# Editar o valor do serviço na tela de edição

Hoje a janela "Editar Serviço" permite alterar morador, contato, CPF/CNPJ, bloco, apartamento, tipo, data, status, turno, técnico, observação e fotos — mas não o valor cobrado. O campo `valor_servico` existe no banco e já é usado nos relatórios e exportações.

## O que muda

- Novo campo **Valor (R$)** no formulário de edição do serviço, ao lado da forma de pagamento/CPF, aceitando valores com vírgula ou ponto (ex.: `150,00`).
- O valor é carregado do serviço ao abrir a janela e salvo junto com as demais alterações.
- Campo opcional: se ficar vazio, o valor é gravado como nulo.
- Também será exibido/editável o campo **Forma de pagamento** (fatura, PIX, cartão de crédito/débito, boleto, dinheiro, outro), já que ele acompanha o valor nos relatórios.

## Detalhes técnicos

Arquivo: `src/components/medicao-terceirizada/ServicoNacionalGasDialog.tsx`

- Adicionar `valor_servico` (string no formulário) e `forma_pagamento` ao `formSchema`, à interface `servico` e aos `defaultValues`.
- No `form.reset`, preencher com o valor atual formatado em pt-BR.
- Na mutação, normalizar a string (trocar `.` por nada e `,` por `.`) e enviar `valor_servico` como número ou `null`, e `forma_pagamento` como texto ou `null`.
- Reaproveitar os rótulos de forma de pagamento já existentes em `src/lib/formatters.ts`.
