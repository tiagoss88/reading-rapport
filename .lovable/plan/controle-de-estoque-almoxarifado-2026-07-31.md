# Controle de Estoque / Almoxarifado

O banco já tem a base pronta (materiais, movimentações, receita por tipo de serviço e baixa automática ao executar serviço), mas **não existe nenhuma tela** para usar isso. O plano é construir a interface completa e ajustar o acesso.

## O que será criado

### 1. Nova página "Estoque" (menu Operação)
Rota `/estoque`, com quatro abas:

**Aba Materiais (almoxarifado)**
- Tabela com: nome, categoria, unidade, saldo atual, estoque mínimo, status.
- Saldo calculado como entradas menos saídas de cada material.
- Linha destacada em vermelho quando saldo ≤ estoque mínimo.
- Botões: novo material, editar, ativar/inativar.
- Busca por nome/categoria e filtro "somente abaixo do mínimo".

**Aba Movimentações**
- Histórico com data, material, tipo (entrada/saída/ajuste), quantidade, motivo, serviço vinculado e quem registrou.
- Filtros por material, tipo e período.
- Botões "Registrar entrada" e "Registrar saída/baixa manual" (quantidade, motivo, observação).

**Aba Receita por serviço**
- Define quais materiais e em que quantidade cada tipo de serviço consome (religação, desligamento, visita técnica etc.).
- É isso que alimenta a baixa automática de estoque quando um serviço é marcado como executado.

**Aba Resumo**
- Cartões: total de itens ativos, itens abaixo do mínimo, entradas e saídas do mês.
- Lista dos materiais em nível crítico e dos que mais saíram no período.

### 2. Ajustes de acesso
Hoje as tabelas de estoque só permitem acesso a administradores, o que impede que a baixa automática registre movimentação quando um operador executa o serviço, e impede gestores de consultar o estoque.
- Leitura de materiais e movimentações liberada para usuários autenticados.
- Criação/edição de materiais e da receita continua restrita a administradores.
- Registro manual de movimentação permitido a administradores e gestores.
- A baixa automática passa a funcionar para qualquer operador que conclua um serviço.

### 3. Integração com serviços
- Na tela de detalhes de execução do serviço, exibir os materiais consumidos naquele atendimento (movimentações vinculadas ao serviço).

## Detalhes técnicos

- Uma migração ajusta as políticas das tabelas `materiais`, `estoque_movimentacoes` e `tipo_servico_materiais`, e garante que a função de baixa automática (`baixa_estoque_ao_executar_servico`, já existente com `SECURITY DEFINER`) opere sem bloqueio.
- Saldo por material: view `public.materiais_saldo` (soma de entradas − saídas + ajustes) para evitar cálculo no cliente; grants para `authenticated`.
- Arquivos novos: `src/pages/Estoque.tsx`, `src/components/estoque/MateriaisTab.tsx`, `MovimentacoesTab.tsx`, `ReceitaServicoTab.tsx`, `ResumoEstoqueTab.tsx`, `MaterialDialog.tsx`, `MovimentacaoDialog.tsx`.
- Arquivos alterados: `src/App.tsx` (rota), `src/components/Layout.tsx` (item no grupo Operação), `src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx` (materiais consumidos).
- Padrão visual mantido: tabelas compactas (`text-xs`, cabeçalho `h-9`), cards `p-4`.
