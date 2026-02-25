

## Novo Card "Cronograma de Leitura" no Menu do Coletor

### Objetivo

Adicionar um card "Cronograma de Leitura" acima de "Confirmação de Leituras" no menu do coletor, que leva a uma nova página onde o operador visualiza o planejamento das rotas de leitura por UF (dados da tabela `dias_uteis`).

### Alterações

**1. Nova página: `src/pages/ColetorCronograma.tsx`**
- Tela mobile-friendly (sem Layout admin), mesmo estilo das outras páginas do coletor.
- Filtros: UF (select), Mês e Ano.
- Consulta `dias_uteis` filtrando por UF/mês/ano, ordenado por `numero_rota`.
- Consulta `empreendimentos_terceirizados` para mostrar quantidade de empreendimentos e medidores por rota.
- Consulta `rotas_leitura` para mostrar operador designado (se houver).
- Exibe lista de cards (um por dia útil/rota) com: número da rota, data formatada, quantidade de empreendimentos e medidores, status (planejado/não planejado).
- Botão voltar para `/coletor`.
- Somente visualização (sem ações de planejar/excluir).

**2. `src/pages/ColetorMenu.tsx`**
- Importar `Calendar` do lucide-react.
- Adicionar novo card "Cronograma de Leitura" antes do card de "Confirmação de Leituras", com:
  - Ícone: `Calendar` em fundo roxo.
  - Título: "Cronograma de Leitura".
  - Legenda: "Planejamento das rotas por UF".
  - Texto inferior: "Visualizar datas e rotas programadas".
  - Permissão: `coletor_leituras` (mesma do card de leituras).
  - Navegação para `/coletor/cronograma`.

**3. `src/App.tsx`**
- Importar `ColetorCronograma`.
- Adicionar rota `/coletor/cronograma` protegida por `ColetorProtectedRoute` + `PermissionRoute` com permissão `coletor_leituras`.

