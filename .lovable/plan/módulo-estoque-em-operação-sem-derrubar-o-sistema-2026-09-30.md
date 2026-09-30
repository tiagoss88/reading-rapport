# Módulo Estoque em Operação (sem derrubar o sistema)

## Por que o sistema parava
- O sistema publicado usa um banco, e as mudanças de banco feitas aqui eram aplicadas em outro. As tabelas de estoque (materiais, movimentações, materiais por tipo de serviço e saldo) existem só nesse segundo banco.
- Verificado agora: no banco do sistema publicado, as 5 estruturas de estoque retornam "tabela não encontrada".
- Quando uma tela de Estoque tentava ler essas tabelas, dava erro. Como não existe nenhuma proteção contra falhas de tela, o sistema inteiro ficava em branco.
- Risco extra: existe uma regra automática de "baixa ao executar serviço" presa à tabela de serviços. Se ela for criada antes das tabelas de estoque, fechar qualquer OS passa a dar erro.

## O que vai ser feito

### 1. Script do banco (você roda)
Um script único e seguro para o banco publicado, que pode ser rodado mais de uma vez sem problema, nesta ordem:
1. Tabelas: materiais, movimentações de estoque (entrada/saída/ajuste) e materiais por tipo de serviço.
2. Visão de saldo por material (entradas − saídas).
3. Acesso restrito a administradores.
4. Por último, a baixa automática ao executar a OS. Ela fica protegida: se algo falhar, a OS fecha normalmente, a baixa só não é feita e o erro vai para o Log de Erros.

Também vai um script de desfazer, que remove só a baixa automática caso algo dê errado.

### 2. Tela Estoque (Operação > Estoque, só admin)
Três abas:
- **Materiais**: cadastrar, editar e desativar (nome, unidade, categoria, estoque mínimo), com saldo atual e aviso de "abaixo do mínimo".
- **Movimentações**: lançar entrada, saída ou ajuste com motivo e observação; histórico com filtro por período, material e tipo; baixas feitas por OS mostram o protocolo.
- **Baixa por serviço**: para cada tipo de serviço, definir os materiais e quantidades que são descontados ao fechar a OS.

### 3. Proteção para nunca mais derrubar o sistema
- A tela de Estoque só é carregada quando você abre a página, e fica isolada: se ela falhar, só ela mostra um aviso.
- Antes de abrir, a tela verifica se as tabelas existem. Se não existirem, mostra "Módulo de estoque ainda não instalado no banco" com o botão para copiar o script, em vez de quebrar.
- Uma proteção geral de tela passa a registrar qualquer falha no Log de Erros e mostrar uma mensagem com "Recarregar", sem tela branca.

## Ordem de entrega
1. Publicar a tela com as proteções: ela aparece como "não instalado" e nada mais é afetado.
2. Você roda o script no banco.
3. Recarregar: o Estoque passa a funcionar. Depois, fechar uma OS de teste com materiais configurados e conferir a saída automática.

## Detalhes técnicos
- Novos arquivos: `src/pages/Operacao/Estoque.tsx` (abas), `src/components/estoque/*` (MateriaisTab, MovimentacoesTab, ReceitasTab, dialogs), `src/hooks/useEstoque.ts`, `src/components/ErrorBoundary.tsx`, `supabase/manual/estoque_producao.sql` e `supabase/manual/estoque_rollback.sql`.
- `App.tsx`: rota `/operacao/estoque` com `React.lazy` + `Suspense` + ErrorBoundary + `PermissionRoute role="admin"`.
- `Layout.tsx`: item `{ name: 'Estoque', href: '/operacao/estoque', icon: Package }` em `operacaoItems`; `/operacao` em `operacaoPaths`; importar `Package` de lucide-react (um ícone não importado é outra causa comum de tela branca).
- Verificação de instalação: `select id from materiais limit 1`; código `PGRST205` → estado "não instalado".
- SQL: `create table if not exists`, GRANT para authenticated/service_role, RLS com `has_role(auth.uid(),'admin')`, `create or replace view v_estoque_saldo`, trigger `trg_baixa_estoque` recriado com `drop trigger if exists` e bloco `exception when others` que grava em `logs_erro` e retorna `NEW`.
- Nada muda nos serviços, relatórios, coletor ou PDFs; o banco de testes não é alterado.
