Vou ajustar a importação de serviços para que a validação de duplicidade não dependa de uma busca incompleta nem de texto exatamente igual.

Plano:

1. Corrigir a busca de serviços existentes
   - Hoje a consulta usada para montar os duplicados não tem paginação/range.
   - A API retorna apenas um lote padrão, então serviços fora desse lote não entram no `existingKeys`.
   - Vou buscar todos os registros necessários em páginas/chunks antes de comparar.

2. Fortalecer a chave de comparação
   - Manter a regra principal: UF + condomínio + bloco/apto + morador, sem considerar protocolo e sem considerar data de solicitação.
   - Normalizar melhor os campos:
     - remover acentos;
     - padronizar maiúsculas/minúsculas e espaços;
     - remover sufixos como `(GTI)`, `(FS)`;
     - ignorar prefixo `BA ` no nome do condomínio quando aplicável;
     - tratar `UNICO`, `ÚNICO`, vazio e `null` como equivalentes para bloco;
     - limpar pontuação de bloco/apto.

3. Evitar falso negativo quando o morador vier vazio ou diferente
   - Para comparação com registros existentes, usar uma chave secundária por UF + condomínio + bloco/apto.
   - Se o morador estiver preenchido nos dois lados e bater, marca como duplicado pela chave completa.
   - Se faltar morador em um dos lados, ainda marca como provável duplicado pela unidade, evitando casos como Barcelona ÚNICO 404 e Sonata B 302 passarem batido.

4. Melhorar o feedback visual da prévia
   - Continuar exibindo “Duplicado”.
   - Adicionar a razão interna no registro importado, por exemplo: “Duplicado por unidade existente” ou “Duplicado por morador/unidade”, para facilitar conferência.

5. Validar com os exemplos citados
   - Testar mentalmente/por função local as normalizações:
     - `Barcelona` deve casar com `BARCELONA (GTI)`.
     - `UNICO` deve casar com bloco vazio/null ou `ÚNICO` quando for torre única.
     - `Sonata B 302` deve casar mesmo com diferença de caixa, acento, espaço ou pontuação.

Arquivos previstos:
- `src/components/medicao-terceirizada/ImportarPlanilhaDialog.tsx`

Não vou alterar banco de dados neste ajuste; é correção da lógica de importação no frontend.