# Backup dos dados do AG-Flow para MariaDB (somente leitura)

## Situação
- O banco que consigo acessar diretamente está vazio (0 serviços). Os dados oficiais ficam no banco usado pelo sistema publicado.
- O arquivo 001_estrutura_ag_flow.sql ainda não existe nos seus Arquivos.

## O que vou fazer
1. Ler os dados oficiais pelo próprio sistema, entrando com uma conta de administrador (só leitura, página por página). Se precisar, peço sua aprovação para usar sua conta de admin.
2. Gerar também o 001_estrutura_ag_flow.sql (tabelas MariaDB), para que o 002 siga a mesma ordem.
3. Gerar 002_dados_ag_flow.sql:
   - Ordem pais antes dos filhos (empreendimentos, operadores, materiais, armazéns -> clientes, serviços -> leituras, histórico, movimentações, financeiro...).
   - Datas em DATETIME UTC, verdadeiro/falso como 1/0, fotos como JSON, vazios como NULL.
   - INSERTs em grupos de 500 linhas, com `SET FOREIGN_KEY_CHECKS` e `utf8mb4`.
4. Gerar 002_conferencia.txt com a quantidade de registros por tabela e o total.
5. Conferir: contagem de linhas no arquivo = contagem lida; testar a importação num MariaDB temporário aqui.

## O que não entra
- Senhas, chaves de API (mcp_api_keys sem o valor da chave), tokens.
- Usuários de login: só id e e-mail (sem senha), para manter vínculos de papéis e permissões.
- Arquivos de fotos: só os endereços (links) ficam no backup.

## Limite
- Tabelas que a conta de admin não puder ler serão listadas na conferência como "não acessível". Se o acesso pelo sistema falhar por completo, entrego um script de leitura para você rodar no editor SQL, que produz o mesmo 002.

Nada no código, banco, usuários ou configurações será alterado.
