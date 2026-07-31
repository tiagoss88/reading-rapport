## Objetivo

Padronizar a exibição de forma de pagamento, CPF/CNPJ e telefone nos detalhes da execução e nos PDFs (Relatório de Atendimento e Comprovante de Pagamento). Hoje aparecem crus: `cartao_credito` e `12136689568`.

## O que muda

**1. Novos formatadores em `src/lib/formatters.ts`**
- `formatCpfCnpj(valor)`: aplica automaticamente a máscara certa — 11 dígitos → `121.366.895-68`; 14 dígitos → `44.620.393/0001-01`; qualquer outro tamanho é devolvido como está (sem inventar formato).
- `formatFormaPagamento(valor)`: converte o código para rótulo legível — `fatura` → Fatura, `pix` → PIX, `cartao_credito` → Cartão de Crédito, `cartao_debito` → Cartão de Débito, `boleto` → Boleto, `dinheiro` → Dinheiro, `outro` → Outro. Valor desconhecido vira texto capitalizado com underscores trocados por espaço.
- `formatTelefone(valor)`: `(85) 99973-6220` para 11 dígitos e `(85) 3333-4444` para 10; demais tamanhos ficam inalterados.

**2. Onde aplicar**
- `DetalhesExecucaoDialog.tsx` — cartões "Forma de Pagamento", "CPF / CNPJ" e "Telefone".
- `exportRegistroAtendimento.ts` (PDF do relatório de atendimento) — mesmos três campos.
- `exportComprovantePagamento.ts` (comprovante) — CPF/CNPJ e pagamento (hoje só um `.toUpperCase()`).

Apenas formatação de exibição: nada muda no banco, os valores continuam salvos como estão.

## Detalhes técnicos

- Os helpers atuais `formatCPF`/`formatCNPJ` continuam existindo (usados em campos de digitação progressiva); `formatCpfCnpj` é para exibição de valor final.
- Todos os helpers tratam `null`/`undefined` retornando `''`, mantendo os fallbacks `—` já usados nos PDFs.
