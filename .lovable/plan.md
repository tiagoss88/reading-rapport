# Novo relatório: Cadastro de Condomínios por UF Completo

Adicionar, na página de Relatórios de Leituras, um novo tipo de relatório chamado **Cadastro de Condomínios por UF Completo**, com as colunas:

UF | Condomínio | Rota | Quantidade de Medidores | Endereço Completo

## Comportamento

- Aparece na lista de tipos de relatório da categoria Leituras, junto do relatório atual.
- Mesmo filtro por UF já existente (ou "Todas").
- Ordenação por UF e depois nome do condomínio.
- Subtotais por UF e total geral, como no relatório atual.
- Exportação em PDF, Excel e CSV com as mesmas cinco colunas.
- O relatório atual "Cadastro de Condomínios por UF" continua igual, sem mudanças.

## Detalhes técnicos

- Novo valor `cadastro_condominios_uf_completo` no tipo `TipoRelatorio` (`src/pages/Relatorios.tsx`).
- Entrada na lista de `RelatorioSelector.tsx` (categoria Leituras).
- Novo hook `useRelatorioCadastroCondominiosCompleto` (baseado no existente), buscando também `endereco` de `empreendimentos_terceirizados`.
- `FiltrosRelatorio.tsx`: incluir o novo tipo nas condições do filtro de UF, no carregamento de UFs e no despacho de geração.
- `TabelaRelatorio.tsx`: colunas e linhas do novo tipo, com destaque para linhas de subtotal.
- `exportPDF.ts` (título, cabeçalho de UF e colunas — usar orientação paisagem para caber o endereço), `exportCSV.ts` e `ExportacaoButtons.tsx` (Excel, largura maior na coluna de endereço).
