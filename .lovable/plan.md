# Deixar Serviços e Estoque mais fluidos

## O que foi verificado
- **Serviços:** a tela baixa todos os serviços de uma vez, com todas as colunas (inclusive observações longas, links de fotos e assinaturas), em blocos de 1000 feitos um depois do outro. Só então mostra a lista.
- A busca refaz o filtro e a ordenação a cada letra digitada, sobre a lista inteira.
- A planilha de exportação (Excel) é carregada junto com a tela, mesmo sem clicar em exportar.
- **Estoque:** antes de abrir, a tela faz 3 rodadas de verificação em sequência. Movimentações busca os dados em duas etapas seguidas. Qualquer gravação manda atualizar todas as abas do estoque ao mesmo tempo.

## O que será feito
1. **Serviços abre mais rápido:** a lista passa a buscar só as colunas que aparecem na tabela e nos filtros. Os blocos de dados são buscados em paralelo. Os dados completos (fotos, assinatura, observações) só são buscados ao abrir Editar ou Detalhes.
2. **Busca sem travar:** a busca espera uma pausa curta na digitação (0,3 s) e o filtro/ordenação só é refeito quando algo muda.
3. **Exportar sob demanda:** o Excel só é carregado ao clicar em exportar.
4. **Estoque abre mais rápido:** a verificação de instalação vira uma única rodada em paralelo e fica guardada por 10 minutos. Movimentações busca os nomes de materiais, armazéns e protocolos junto, sem esperar.
5. **Atualizações mais leves:** ao salvar, só as abas afetadas são atualizadas (ex.: transferência atualiza saldo e movimentações, não a configuração de receitas).
6. **Banco (opcional):** script com índices para as buscas de serviços e movimentações, para você rodar no banco oficial. Pode rodar mais de uma vez.

Nada muda em regras, campos, relatórios, permissões ou na baixa de estoque.

## Detalhes técnicos
- `Servicos.tsx`: select com lista de colunas da listagem + joins atuais; contagem (`count: 'exact', head: true`) e páginas `range` via `Promise.all`; `useDeferredValue`/debounce no `searchTerm`; `useMemo` em filtros/tipos; `import('xlsx')` dinâmico em `handleExportarClientes`.
- `ServicoNacionalGasDialog`/`DetalhesExecucaoDialog`: ao abrir, buscar `select('*')` do serviço pelo id (react-query `['servico', id]`) e usar como fonte do formulário.
- `useEstoque.ts`: `useEstoqueInstalacao` com todos os checks num único `Promise.all`, `staleTime: 600_000`; `useMovimentacoes` com armazéns em paralelo à primeira consulta; `materiais` com colunas explícitas.
- Invalidações específicas (`['estoque','materiais']`, `['estoque','movimentacoes']`, etc.) em MateriaisTab, MovimentacoesTab, TransferirDialog, BaixaManualTab, ArmazensTab.
- `supabase/manual/indices_desempenho.sql`: `create index if not exists` em `servicos_nacional_gas(created_at desc)`, `(uf, status_atendimento)`, `estoque_movimentacoes(created_at desc)`, `(servico_id)`, `(material_id, armazem_id)`.
