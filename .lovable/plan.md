# Deixar o sistema mais ágil

## O que foi verificado
- Quase todas as telas (cerca de 48) são carregadas de uma vez ao abrir o sistema, mesmo as que o usuário nunca usa (relatórios, PDFs, planilhas, mapas). Só Estoque e Relatórios de Estoque carregam sob demanda.
- Os dados de cada tela são buscados de novo a cada troca de página ou volta à janela, porque não há tempo de reaproveitamento configurado.
- 26 arquivos pedem todas as colunas das tabelas (`select *`), trazendo mais dados do que a tela mostra.
- Imagens são leves; não são o problema.

## O que será feito
1. **Abertura mais rápida:** cada tela passa a ser carregada só quando for aberta, com um indicador curto de carregamento e a mesma proteção contra tela branca do Estoque. Login, Dashboard e coletor continuam prontos imediatamente.
2. **Bibliotecas pesadas sob demanda:** geração de PDF, Excel e mapas só é baixada quando o usuário clica para exportar ou abre o mapa.
3. **Menos buscas repetidas:** dados reaproveitados por 1 minuto ao navegar entre telas e sem nova busca automática ao voltar para a aba do navegador. Ao salvar algo, a lista continua atualizando na hora.
4. **Consultas mais enxutas** nas telas mais usadas (Serviços, Leituras, Planejamento, coletor): buscar só as colunas exibidas, mantendo a paginação existente.
5. **Banco:** listar as consultas mais lentas e sugerir índices em um script para você rodar no banco publicado (mesmo padrão dos scripts de estoque), se houver ganho.
6. **Conferência:** medir o tamanho do carregamento inicial antes e depois e abrir as principais telas para garantir que nada quebrou.

Nada muda em regras, campos, relatórios ou permissões.

## Detalhes técnicos
- `App.tsx`: `React.lazy` + `Suspense` + `ErrorBoundary` nas rotas; `QueryClient` com `staleTime: 60_000`, `refetchOnWindowFocus: false`, `retry: 1`.
- `vite.config.ts`: `manualChunks` para jspdf/autotable, xlsx, leaflet/mapas, recharts; `import()` dinâmico em `exportPDF.ts`, `exportCSV`/Excel, `exportRegistroAtendimento.ts`, `exportEstoque.ts`.
- Substituir `select('*')` por listas de colunas nas páginas críticas.
- Índices sugeridos (ex.: `servicos_nacional_gas(status_atendimento, data_agendamento)`, `(uf)`, `(tecnico_id)`) em `supabase/manual/indices_desempenho.sql` com `create index if not exists`.
