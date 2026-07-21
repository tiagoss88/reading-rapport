## Diagnóstico confirmado

A tela de Estoque está tentando gravar em um backend diferente daquele onde as tabelas de estoque existem.

- A requisição real da tela vai para o backend antigo `mxoflgl...` e recebe: `Could not find the table 'public.materiais' in the schema cache`.
- As tabelas `materiais`, `estoque_movimentacoes`, `tipo_servico_materiais` e a view `v_estoque_saldo` existem e têm permissões no backend atual do Lovable Cloud.
- Portanto, o problema não é mais permissão/RLS: é a configuração do cliente do app apontando para o backend errado no ambiente da prévia/publicação.

## Plano de correção

1. **Atualizar a configuração do app para usar o backend correto**
   - Verificar os arquivos de ambiente/configuração gerenciados pelo projeto.
   - Corrigir a URL/chave pública usada pelo frontend, sem expor segredos e sem mexer em chave privada.

2. **Manter as tabelas de Estoque como estão**
   - Não recriar tabelas.
   - Não adicionar políticas permissivas.
   - Não criar RPC ou atalhos inseguros.

3. **Validar a tela novamente**
   - Recarregar a prévia.
   - Testar o caminho real de “Novo material”.
   - Confirmar que a requisição passa a ir para o backend correto e não retorna mais erro de schema cache.

## Resultado esperado

Ao clicar em **Operação → Estoque → Novo material → Salvar**, o material será cadastrado normalmente e a lista de materiais/saldo será atualizada.