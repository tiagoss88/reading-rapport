

## Permitir operadores verem empreendimentos terceirizados

### Problema
A tabela `empreendimentos_terceirizados` tem uma politica RLS que so permite leitura para `admin` e `gestor_empreendimento`. O usuario Cristian tem papel de operador, entao a query retorna vazio - por isso o dropdown de UFs nao mostra nenhum valor.

### Solucao
Criar uma nova politica RLS de SELECT na tabela `empreendimentos_terceirizados` que permita operadores lerem os dados. Operadores precisam ver os empreendimentos para fazer as leituras no coletor.

### Alteracoes tecnicas

**1. Nova migracao SQL**
Adicionar uma politica RLS para permitir que operadores (qualquer usuario autenticado com role de operador) possam fazer SELECT na tabela `empreendimentos_terceirizados`:

```text
CREATE POLICY "Operadores podem ver empreendimentos terceirizados"
  ON public.empreendimentos_terceirizados FOR SELECT
  USING (
    has_role(auth.uid(), 'operador_completo')
    OR has_role(auth.uid(), 'operador_leitura')
    OR has_role(auth.uid(), 'operador_servicos')
  );
```

Tambem verificar se as tabelas relacionadas (`servicos_nacional_gas`, `rotas_leitura`) precisam de politicas similares para que o fluxo completo do coletor funcione para operadores.

**2. Verificar tabelas relacionadas**
As seguintes tabelas tambem serao verificadas e, se necessario, terao politicas de leitura adicionadas para operadores:
- `servicos_nacional_gas` (para registrar execucoes)
- `rotas_leitura` (para ver rotas atribuidas)
- `dias_uteis` (para ver calendario)

Nenhuma alteracao de codigo frontend e necessaria - o problema e exclusivamente de permissao no banco de dados.

