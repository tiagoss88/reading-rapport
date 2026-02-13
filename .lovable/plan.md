

## Corrigir erro de RLS para operadores na tabela servicos_nacional_gas

### Problema
O operador "Cristian" recebe o erro **"new row violates row-level security policy for table servicos_nacional_gas"** ao tentar confirmar uma coleta. Isso acontece porque a politica de INSERT na tabela `servicos_nacional_gas` permite apenas usuarios com papel `admin` ou `gestor_empreendimento`. Operadores nao tem permissao de inserir registros.

### Solucao
Criar uma nova politica RLS que permita operadores (com papeis `operador_completo` ou `operador_leitura`) inserir registros na tabela `servicos_nacional_gas`. Isso e necessario porque o fluxo do coletor exige que o proprio operador registre a coleta ao confirmar.

### Detalhes tecnicos

**Nova migration SQL:**

```sql
CREATE POLICY "Operadores podem registrar coletas"
  ON public.servicos_nacional_gas FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'operador_completo')
    OR has_role(auth.uid(), 'operador_leitura')
  );
```

Essa politica sera adicionada via uma nova migration, sem alterar as politicas existentes de admin/gestor.

