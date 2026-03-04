

## Diagnóstico: Condomínios duplicados na Rota do Dia

### Causa
A query da aba "Rota do Dia" busca registros de `rotas_leitura` diretamente. Quando um empreendimento tem **mais de um operador atribuído** no mesmo dia, existem múltiplos registros em `rotas_leitura` (um por operador). Cada registro vira uma linha na tabela, causando a duplicação visual.

### Solução
Agrupar os registros por `empreendimento_id` antes de renderizar. Cada empreendimento aparece **uma única vez** na tabela, e a coluna "Operador Atribuído" lista todos os operadores separados por vírgula.

### Arquivo alterado
**`src/pages/MedicaoTerceirizada/Leituras.tsx`** — linhas 237-258

- Criar um `useMemo` que agrupa `rotasDoDia` por `empreendimento_id`
- Cada grupo gera um objeto com: dados do empreendimento, lista de operadores (nomes únicos), e status consolidado (concluído se qualquer registro estiver concluído ou existir serviço executado)
- Iterar sobre os grupos em vez dos registros individuais
- Coluna "Operador Atribuído" exibe `operadores.join(', ')` ou "Não atribuído"

