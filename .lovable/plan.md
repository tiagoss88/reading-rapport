
Objetivo: corrigir de forma definitiva o caso em que, após upload do comprovante no coletor, a “Rota do Dia” continua como “Pendente”.

Diagnóstico técnico (com base no código atual):
1) Em `src/pages/ColetorEmpreendimentoDetalhe.tsx`, a atualização da rota foi adicionada, porém está “fire-and-forget”:
   - não valida `error`
   - não valida quantidade de linhas afetadas
2) Na migração `20251214223717...sql`, `rotas_leitura` só permite `UPDATE` para admin/gestor. Operador comum tende a atualizar 0 linhas sem erro explícito (efeito silencioso de RLS).
3) Ainda existe risco de divergência de data por uso de `toISOString().split('T')[0]` (UTC), que pode não bater com a data operacional local no fim do dia.

Plano de implementação (correção robusta):
1) Backend: sincronização automática de status via trigger (fonte da verdade no banco)
   - Criar nova migração em `supabase/migrations/` com:
     - função `public.sync_rota_status_from_servico()` (`SECURITY DEFINER`, `SET search_path = public`)
     - trigger `AFTER INSERT OR UPDATE` em `public.servicos_nacional_gas`
   - Regra da função:
     - se `NEW.tipo_servico = 'leitura'`
     - e `NEW.status_atendimento = 'executado'`
     - e `NEW.empreendimento_id` + `NEW.data_agendamento` não nulos
     - então `UPDATE rotas_leitura SET status = 'concluido'` onde:
       - `empreendimento_id = NEW.empreendimento_id`
       - `data = NEW.data_agendamento`
       - `status <> 'concluido'`
   - Vantagem: elimina dependência de permissão do cliente para fechar rota.

2) Backfill imediato (corrigir registros já “travados” em pendente)
   - Na mesma migração, executar `UPDATE ... FROM ...` para marcar como `concluido` as rotas já correspondentes a serviços de leitura executados:
     - join por `empreendimento_id` + `data_agendamento = data`
     - somente onde `rotas_leitura.status <> 'concluido'`

3) Frontend coletor: remover falsa sensação de sucesso e padronizar data local
   - Arquivo: `src/pages/ColetorEmpreendimentoDetalhe.tsx`
   - Ajustes:
     - trocar `toISOString().split('T')[0]` por data local (`format(new Date(), 'yyyy-MM-dd')` de `date-fns`)
     - manter apenas o insert em `servicos_nacional_gas` (a trigger cuidará da rota), ou manter update como “best effort” com checagem explícita de resultado e log de warning
   - Resultado: menos chance de mismatch de data e fluxo mais previsível.

4) Tela administrativa “Rota do Dia”: blindagem visual (opcional, recomendada)
   - Arquivo: `src/pages/MedicaoTerceirizada/Leituras.tsx`
   - Adicionar fallback de exibição:
     - buscar IDs de empreendimentos com serviço `leitura/executado` na data selecionada
     - se rota vier `pendente` mas empreendimento estiver nesse conjunto, exibir badge como concluído
   - Isso protege UI durante transições/latência e evita percepção de inconsistência.

5) Validação E2E (critério de aceite)
   - Cenário principal:
     1. operador abre coletor e confirma coleta com foto
     2. registro entra em `servicos_nacional_gas` como `executado`
     3. `rotas_leitura` muda para `concluido` automaticamente no banco
     4. em `/medicao-terceirizada/leituras` (aba Rota do Dia), status aparece “Concluído”
   - Cenários adicionais:
     - testar com usuário operador (não admin)
     - testar próximo das 21h–23h (risco de UTC/local)
     - validar que não regressa de `concluido` para `pendente`

Arquivos envolvidos:
- `supabase/migrations/<nova_migracao_sync_status_rotas>.sql` (novo)
- `src/pages/ColetorEmpreendimentoDetalhe.tsx`
- `src/pages/MedicaoTerceirizada/Leituras.tsx` (fallback opcional recomendado)

Diagrama rápido do fluxo final:
```text
Coletor confirma coleta
        |
        v
INSERT servicos_nacional_gas (leitura, executado, data_agendamento)
        |
        v
TRIGGER DB (sync_rota_status_from_servico)
        |
        v
UPDATE rotas_leitura.status = concluido
        |
        v
Tela "Rota do Dia" mostra Concluído
```

Detalhes técnicos (resumo para implementação):
- Causa raiz principal: RLS de `rotas_leitura` bloqueando update de operador + update cliente sem validação de linhas afetadas.
- Correção estrutural: sincronização no banco (trigger + backfill) em vez de depender do cliente.
- Robustez adicional: usar data local no coletor e fallback visual na página administrativa.
