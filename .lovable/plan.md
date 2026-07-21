
## Objetivo
Criar módulo "Estoque" dentro do grupo "Operação" para controle de materiais, com cadastro, movimentações, histórico, alerta de mínimo e baixa automática vinculada aos serviços executados. Acesso restrito a admin.

## Alterações previstas

### 1. Banco de dados (migração única)
Criar 4 tabelas em `public` (todas com RLS e GRANT):

- **`materiais`** — catálogo
  - Campos: `nome`, `descricao`, `unidade` (un/m/kg/L), `categoria`, `estoque_minimo` numeric default 0, `ativo` boolean default true.
- **`estoque_movimentacoes`** — histórico único de entradas/saídas
  - Campos: `material_id` (FK), `tipo` (`entrada`|`saida`|`ajuste`), `quantidade` numeric, `motivo` text, `servico_id` (FK opcional para `servicos_nacional_gas`), `operador_id` uuid, `observacao`, `criado_por` uuid, `created_at`.
- **`tipo_servico_materiais`** — receita de consumo por tipo de serviço
  - Campos: `tipo_servico` text (mesmo enum/texto usado em `servicos_nacional_gas.tipo_servico`), `material_id` FK, `quantidade` numeric. UNIQUE(tipo_servico, material_id).
- **View `v_estoque_saldo`** — soma das movimentações por material (entrada + / saida − / ajuste = valor absoluto de reposição).

RLS/GRANT: leitura e escrita apenas para admin (`has_role(auth.uid(),'admin')`); `GRANT ... TO authenticated` + `service_role`. Sem `anon`.

Trigger `baixa_estoque_ao_executar_servico` em `servicos_nacional_gas`: quando `status_atendimento` muda para `executado` (ou equivalente), insere linhas em `estoque_movimentacoes` (tipo `saida`) para cada material da receita `tipo_servico_materiais` correspondente, vinculando `servico_id`. Idempotente: não cria movimentações se já existirem para aquele `servico_id`.

### 2. Frontend

- **`src/components/Layout.tsx`**: adicionar item `{ name: 'Estoque', href: '/operacao/estoque', icon: Package }` em `operacaoItems`, protegido por `role="admin"` (renderizado condicionalmente dentro do map ou como item extra com `ProtectedComponent`).
- **`src/pages/Operacao/Estoque.tsx`** (nova página) com abas:
  1. **Materiais** — tabela com nome, categoria, unidade, saldo atual, mínimo, status (badge "baixo" quando saldo < mínimo). Botões novo/editar/desativar.
  2. **Movimentações** — histórico paginado com filtros por material, tipo, período; botão "Nova movimentação" (entrada/saída/ajuste manual).
  3. **Receitas por serviço** — configuração de quantos itens de cada material são consumidos por tipo de serviço (usada pelo trigger).
- **`src/App.tsx`**: rota `/operacao/estoque` protegida (`PermissionRoute` com `role="admin"`).
- Dialogs auxiliares: `NovoMaterialDialog`, `NovaMovimentacaoDialog`, `ReceitaServicoDialog` em `src/components/operacao/estoque/`.

### 3. Integração com Serviços
- Na execução do serviço (`ExecucaoServicoTerceirizado.tsx`), nenhum código extra é necessário: o trigger cuida da baixa quando o status vai para executado.
- Em `DetalhesExecucaoDialog.tsx`: adicionar bloco "Materiais consumidos" listando as movimentações do `servico_id` (somente leitura).

## Critérios de aceitação
- Novo item "Estoque" aparece no grupo Operação apenas para admin.
- Página permite CRUD de materiais, registrar entradas/saídas manuais e visualizar saldo em tempo real.
- Ao marcar um serviço como executado, saldo é reduzido conforme a receita configurada, sem duplicar em re-salvamentos.
- Alerta visual quando saldo < estoque mínimo.
- Nenhuma alteração destrutiva em tabelas existentes.

## Detalhes técnicos
- Saldo calculado via view (`SUM(CASE tipo WHEN 'entrada' THEN quantidade WHEN 'saida' THEN -quantidade ELSE quantidade END)`).
- Trigger usa `SECURITY DEFINER` com `search_path=public`.
- RLS: todas as políticas usam `public.has_role(auth.uid(), 'admin')`.
- Ícone `Package` do lucide-react.
