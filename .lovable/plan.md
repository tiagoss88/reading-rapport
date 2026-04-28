# Corrigir contagem de Serviços no Relatório RDO

## Diagnóstico

Comparando as duas telas que leem da tabela `servicos_nacional_gas`:

**Medição / Serviços** (mostra todos os serviços corretamente)
- Carrega tudo sem filtro de data (`order by created_at desc`)
- Filtra "leitura" só no front-end
- Conta todos os serviços, incluindo `pendentes` sem agendamento

**Relatório / Serviços / RDO** (mostra muito menos)
- Filtra `data_agendamento >= inicio AND < fim`
- Registros com `data_agendamento IS NULL` são **silenciosamente descartados**
- Janela default = último 1 mês — agendados fora ficam de fora
- Limite implícito de 1000 linhas do Supabase

Resultado: serviços pendentes (a maioria) e os agendados fora da janela curta nunca aparecem.

## O que será alterado

**Arquivo:** `src/hooks/useRelatorioServicos.tsx`

1. **Usar campo de data com fallback inteligente**
   Em vez de filtrar somente `data_agendamento`, usar o `OR` do PostgREST para considerar:
   - `data_agendamento` quando existir, OU
   - `data_solicitacao` como referência, OU
   - `created_at` como último fallback
   Implementação: trazer um conjunto mais amplo e filtrar por data efetiva no JS (mais simples e correto que `or()` complexo).

2. **Tornar o filtro de data opcional**
   Se o usuário deixar `dataInicio` ou `dataFim` em branco → não aplicar filtro de data (mostra tudo). Hoje o componente sempre preenche, mas o hook deixa de descartar registros sem data.

3. **Incluir registros sem data**
   Registros com `data_agendamento`, `data_solicitacao` e `created_at` todos nulos são raros, mas serão mantidos como `data: null` no resultado para não sumirem.

4. **Remover limite de 1000**
   Adicionar `.range(0, 9999)` para garantir que grandes volumes não sejam cortados silenciosamente.

5. **Escolher coluna de data exibida**
   No campo `data` retornado: usar `data_agendamento ?? data_solicitacao ?? created_at` para a tabela e exportações exibirem sempre algo coerente.

## Comportamento final esperado

- Quantidade de serviços no RDO == quantidade vista em **Medição / Serviços** (descontando "Leitura"), respeitando os filtros opcionais de UF, status, técnico e tipo.
- Período de data agora é uma **janela inclusiva**: pega qualquer serviço cuja data efetiva (agendamento → solicitação → criação) caia dentro do intervalo.
- Serviços `pendentes` sem agendamento agora aparecem normalmente.

## Sem mudanças necessárias em

- Banco de dados (sem migração)
- UI do filtro (`FiltrosRelatorio.tsx`)
- Tabela de resultados (`TabelaRelatorio.tsx`)
- Exportações PDF/CSV (continuam recebendo o mesmo shape)
