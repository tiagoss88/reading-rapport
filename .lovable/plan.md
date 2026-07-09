Vou corrigir o erro na origem: a importação está falhando antes de processar a planilha porque a API do banco que o app está usando não encontra a tabela `gti_leituras_mensais` no cache de schema.

Plano:

1. **Confirmar o alvo correto do banco**
   - Verificar se a tabela existe e está acessível exatamente no mesmo backend que o app em produção/preview está chamando.
   - Separar dois cenários: tabela realmente ausente nesse backend, ou tabela existente mas ainda invisível para a API por cache/permissões.

2. **Aplicar correção idempotente no banco correto**
   - Garantir `CREATE TABLE IF NOT EXISTS public.gti_leituras_mensais` com as colunas usadas pela tela GTI.
   - Garantir a constraint de upsert: `(uf, condominio, ano_referencia, mes_referencia)`.
   - Garantir permissões explícitas para usuários autenticados e serviço interno.
   - Garantir RLS/policies para leitura, importação, edição e exclusão conforme o perfil atual.
   - Forçar recarregamento do schema da API após a migração.

3. **Ajustar a tela para tratar esse erro melhor**
   - Se a API ainda retornar `PGRST205`, exibir uma mensagem mais clara informando que a tabela GTI não está disponível no backend, em vez de apenas mostrar o erro cru.
   - Invalidar/refazer a consulta da aba GTI após importação, sem depender de cache antigo.

4. **Validar a correção**
   - Testar uma consulta de leitura em `gti_leituras_mensais`.
   - Testar o upsert usado pela importação com uma linha segura de validação ou via fluxo real da tela.
   - Confirmar que a aba GTI não retorna mais `Could not find the table`.