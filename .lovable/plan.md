# Corrigir a importação da planilha GTI

## O que está acontecendo

A tabela que guarda os dados da GTI existe no banco e tem todas as regras corretas (unicidade por UF + condomínio + mês/ano, permissões por perfil). O que falta é a liberação de acesso da aplicação a essa tabela: nenhuma permissão de leitura/gravação foi concedida aos perfis do sistema.

Verificado no banco:
- a restrição de unicidade usada pela importação existe;
- as regras de acesso por perfil (admin/gestor) existem;
- **nenhuma concessão de acesso está registrada para a tabela** — por isso qualquer envio ou leitura é recusado pelo servidor antes mesmo de chegar às regras de perfil.

Como o aplicativo só reconhece o caso de "tabela inexistente", a recusa por falta de permissão não entra no caminho alternativo e a importação termina em erro (ou aparentemente sem efeito).

## O que será feito

1. **Liberar o acesso à tabela no banco** (migração)
   - Conceder leitura, inclusão, alteração e exclusão ao perfil de usuários autenticados; acesso total ao perfil de serviço.
   - As regras de perfil já existentes continuam valendo: apenas admin e gestor podem importar/alterar, e só admin pode excluir.

2. **Melhorar a mensagem de erro na tela**
   - Tratar também a recusa por permissão, mostrando um aviso claro ("Você não tem permissão para importar") em vez de uma mensagem técnica.
   - Registrar o erro no console para diagnóstico.

3. **Tornar o reconhecimento das colunas mais tolerante na importação**
   - Aceitar variações comuns de cabeçalho: `CONDOMINIOS`, `EMPREENDIMENTO`, `ESTADO`, `PRAZO INICIO`, `DATA INICIO`, `DATA FIM`, `LEITURA ANT`, além dos nomes já aceitos.
   - Ignorar espaços duplicados e maiúsculas/acentos (já é feito), e ignorar linhas totalmente vazias.
   - Se nenhuma coluna esperada for reconhecida, mostrar aviso listando os cabeçalhos encontrados no arquivo, para o usuário saber o que ajustar.

4. **Validar**
   - Importar um arquivo de teste e confirmar que as linhas aparecem na lista com os prazos de 28 e 32 dias preenchidos.

## Detalhes técnicos

- Migração: `GRANT SELECT, INSERT, UPDATE, DELETE ON public.gti_leituras_mensais TO authenticated; GRANT ALL ... TO service_role;`
- `src/components/medicao-terceirizada/gti/GtiTab.tsx`: ampliar `HEADER_ALIASES`, filtrar linhas vazias em `handleFile`, tratar código `42501` em `getGtiErrorMessage`, e alerta quando nenhum cabeçalho for mapeado.
- Nenhuma mudança de estrutura de tabela ou de colunas.
