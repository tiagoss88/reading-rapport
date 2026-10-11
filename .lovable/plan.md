# Ativar o módulo Financeiro no site oficial

O script `financeiro.sql` não precisa de mudança: ele cria as duas tabelas do
Financeiro (recebimentos e situação da OS), os índices de consulta e libera
acesso somente a admin. Você vai colar e executar no editor SQL do banco
oficial.

Depois disso, falta publicar o app — é isso que faz o menu
**Operação > Financeiro** aparecer no ngd.agasen.com.br.

## Passos

1. **Rodar o script** (você) — colar o conteúdo de `financeiro.sql` no editor
   SQL do banco oficial e executar. Pode rodar mais de uma vez sem causar dano.
2. **Confirmar que as tabelas existem** — ao abrir a tela do Financeiro, o
   sistema já detecta se as tabelas estão lá: se estiverem, as abas aparecem;
   se não estiverem, aparece o aviso de módulo indisponível em vez de tela
   em branco.
3. **Publicar o app** — com o botão Publicar, para a versão no ar passar a
   trazer o menu e a tela do Financeiro.
4. **Testar o fluxo real** — entrar como admin, abrir Operação > Financeiro,
   conferir a aba Contas a receber, registrar um recebimento em uma OS já
   executada e verificar se a situação passa de pendente para pago (e o saldo
   zera). Testar também um estorno e uma isenção com motivo.

## O que o Financeiro mostra

- **Contas a receber**: lista de OS com valor, total já recebido, saldo e
  situação (pendente, parcial, pago, isento), com filtros e botão Registrar.
- **Recebimentos**: histórico de lançamentos, com estorno.
- **Resumo**: totais por mês, forma de pagamento, UF e técnico, além de
  inadimplência acima de um número de dias que você define.
- Tudo com exportação em PDF, Excel e CSV.

## Detalhes técnicos

- Tabelas: `public.financeiro_recebimentos` e `public.financeiro_situacao_os`,
  com RLS restrita a `public.has_role(auth.uid(), 'admin')`.
- Nenhuma trigger é criada em `servicos_nacional_gas`, então fechar uma OS
  continua sem depender do Financeiro.
- Saldos e situações são calculados no app a partir de `servicos_nacional_gas`
  mais os recebimentos registrados; a data de execução vem do histórico de
  mudança de status, com alternativa em `updated_at`.
- Nada é alterado no script: nenhuma edição de código é necessária nesta etapa,
  apenas rodar o SQL e publicar.
