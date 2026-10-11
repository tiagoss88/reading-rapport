# Financeiro — filtro de período (De / Até)

## Situação atual (verificada no código)
- `src/pages/Operacao/Financeiro.tsx` já possui caixas De/Até logo após o filtro de UF (`filtrosComuns`), usadas em "Contas a receber", "Recebimentos" e no resumo.
- Elas aparecem como duas caixinhas de data sem rótulo visível (só um tooltip "De"/"Até") — por isso não são reconhecidas como um filtro de período.
- A lista de inadimplência ignora o período; os resumos (por mês, forma, UF, técnico) respeitam.
- Contas a receber filtra pela data de execução (fechamento da OS); Recebimentos pela data do pagamento.

## Mudanças
1. **Identificar o filtro na tela**: rótulo "Período:" antes das caixas, com "De" e "Até" marcados; botão "Limpar" aparece quando há data ativa.
2. **Atalhos compactos**: chips "Este mês", "Mês passado", "Últimos 30 dias" e "Este ano" ao lado das datas, para fechar o período com um clique (mantendo a interface compacta).
3. **Resultado do período**: linha de resumo mostrando nº de OS / recebimentos e valor total dentro do período ativo, em "Contas a receber" e "Recebimentos".
4. **Inadimplência**: também passa a respeitar o período (por data de execução), igual às demais listas.
5. **Regras mantidas**: sem mudança de banco, de lógica de cálculo, de recebimentos ou de exportações — os relatórios PDF/Excel/CSV continuam saindo com o que está filtrado.

## Arquivo alterado
- `src/pages/Operacao/Financeiro.tsx` — somente a linha de filtros e os resumos.

## Verificação
- Typecheck e build; conferir as 3 abas com período ativo, atalhos e "Limpar".
