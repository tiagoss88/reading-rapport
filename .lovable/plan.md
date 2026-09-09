# Novo relatório: Condomínios Georreferenciados

Adicionar, em Relatórios de Leituras, um novo relatório com UF, condomínio, rota, quantidade de medidores e a localização (latitude e longitude).

## Como vai funcionar

- Novo item na lista de relatórios: "Condomínios Georreferenciados" (categoria Leituras).
- Filtro por UF, igual aos outros relatórios de cadastro.
- Lista todos os condomínios; quando não houver localização cadastrada, as colunas de latitude/longitude mostram "Não georreferenciado".
- Colunas: UF, Condomínio, Rota, Qtd Medidores, Latitude, Longitude.
- Subtotais por UF e total geral, no mesmo padrão do relatório "Cadastro de Condomínios por UF Completo".
- Exportação em PDF, Excel e CSV com as mesmas colunas.

## Detalhes técnicos

- Novo hook `src/hooks/useRelatorioCondominiosGeorreferenciados.tsx`, espelhando o hook "completo", lendo `nome, uf, rota, quantidade_medidores, latitude, longitude` de `empreendimentos_terceirizados`, ordenado por UF e nome, com agregação de subtotais.
- Novo valor `condominios_georreferenciados` no tipo `TipoRelatorio` (`src/pages/Relatorios.tsx`) e no `RelatorioSelector`.
- `FiltrosRelatorio.tsx`: incluir o novo tipo no filtro de UF e no `handleGerarRelatorio`.
- `TabelaRelatorio.tsx`: colunas e linhas do novo tipo, com formatação numérica de 6 casas e fallback "Não georreferenciado".
- `exportPDF.ts`, `exportCSV.ts` e `ExportacaoButtons.tsx`: cabeçalhos, mapeamento de linhas e nome de arquivo para o novo relatório.
- Nenhuma alteração de banco de dados.
