# Estoque com vários armazéns

## O que muda para você
- **Armazéns (nova aba):** você cadastra quantos armazéns quiser (ex.: BA, CE, Central), cada um ligado a um estado (UF), e pode desativar.
- **Materiais:** o cadastro continua único. Na lista aparece o saldo de cada armazém lado a lado, mais o total, e o aviso de "abaixo do mínimo" por armazém.
- **Movimentações:** todo lançamento (entrada, saída, ajuste) pede o armazém. O histórico ganha filtro e coluna de armazém.
- **Transferência:** novo botão "Transferir": escolhe material, quantidade, armazém de origem e destino. Gera a saída de um e a entrada no outro de uma vez, e aparece no histórico como transferência.
- **Baixa ao fechar a OS:** o material sai do armazém do mesmo estado da OS (OS da BA → armazém BA). Se não houver armazém ativo para aquele estado, a OS fecha normalmente, a baixa não é feita e o aviso vai para o Log de Erros.
- **Dados que já existem:** movimentações lançadas antes vão para um armazém "Principal" criado automaticamente, que você pode renomear (ex.: BA).

## Ordem de entrega
1. Publicar a tela atualizada. Enquanto o script novo não for rodado, a tela mostra "atualização do estoque pendente" com o botão para copiar o script, sem afetar o resto do sistema.
2. Você roda o script no banco (seguro para rodar mais de uma vez).
3. Recarregar, cadastrar os armazéns BA e CE e testar uma transferência e o fechamento de uma OS.

## Detalhes técnicos
- Novo script `supabase/manual/estoque_armazens.sql` (idempotente):
  - tabela `armazens` (id, nome, uf, ativo, timestamps) + GRANT + RLS admin via `has_role`;
  - `estoque_movimentacoes`: `add column if not exists armazem_id` (FK armazens), `transferencia_id uuid` e tipo `transferencia` não é novo tipo: grava par saida/entrada com mesmo `transferencia_id`;
  - cria armazém "Principal" e preenche `armazem_id` nulo; depois `set not null`;
  - view `v_estoque_saldo_armazem` (material_id, armazem_id, saldo) com `security_invoker`; `v_estoque_saldo` mantida (total);
  - função `transferir_estoque(material, origem, destino, qtd, obs)` security definer, checa admin e grava as duas linhas numa transação;
  - trigger `baixa_estoque_ao_executar_servico` recriado: busca armazém ativo com `uf = NEW.uf`; sem armazém → registra em `logs_erro` e retorna NEW; mantém `exception when others`.
- Verificação de instalação em `useEstoque.ts`: além das tabelas atuais, checa `armazens`; ausente → estado "atualização pendente" mostrando o novo script.
- UI: `ArmazensTab.tsx` novo; `MateriaisTab` com colunas por armazém; `MovimentacoesTab` com campo/filtro de armazém e `TransferirDialog.tsx`.
- Tudo segue lazy + ErrorBoundary já existente; nada muda em serviços, relatórios, coletor ou PDFs.
