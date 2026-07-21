## Plano

1. **Aplicar correção de permissões no backend**
   - A tabela `materiais` existe no banco, mas as permissões de acesso pela aplicação não aparecem concedidas para os perfis usados pelo app.
   - Vou aplicar os acessos necessários para `materiais`, `estoque_movimentacoes` e `tipo_servico_materiais`, mantendo as regras atuais: somente usuários admin conseguem gerenciar o estoque.

2. **Validar as regras de segurança**
   - Confirmar que as políticas continuam restringindo o módulo Estoque a admin.
   - Rodar a checagem de segurança do backend após a correção.

3. **Verificar o cadastro de material**
   - Repetir a inserção de um material de teste pelo mesmo caminho usado pela tela.
   - Confirmar separadamente:
     - tabela existe;
     - permissões foram concedidas;
     - material pode ser inserido por admin;
     - usuário não admin continua bloqueado pelas regras.

## Detalhe técnico

O erro exibido (`Could not find the table 'public.materiais' in the schema cache`) acontece quando a API da aplicação não consegue enxergar a tabela, mesmo ela existindo no banco. Pelo que verifiquei, as tabelas do Estoque existem, mas não há privilégios de Data API registrados para elas; por isso a correção deve ser no backend, não na tela.