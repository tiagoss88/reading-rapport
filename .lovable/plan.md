
## Adicionar número de protocolo único a cada serviço

### O que muda

Cada serviço na tabela `servicos_nacional_gas` terá um campo `numero_protocolo` gerado automaticamente na criação, com formato sequencial (ex: `NG-000001`, `NG-000002`). O número será visível na listagem e nos detalhes/PDF.

### 1. Migração de banco de dados

Adicionar coluna e função de geração automática:

```sql
ALTER TABLE servicos_nacional_gas
ADD COLUMN numero_protocolo TEXT UNIQUE;

-- Preencher registros existentes
UPDATE servicos_nacional_gas 
SET numero_protocolo = 'NG-' || LPAD(ROW_NUMBER::TEXT, 6, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) 
  FROM servicos_nacional_gas
) sub 
WHERE servicos_nacional_gas.id = sub.id;

-- Função para gerar próximo protocolo
CREATE OR REPLACE FUNCTION generate_protocolo_ng()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_protocolo FROM 4) AS INT)), 0) + 1
  INTO next_num FROM servicos_nacional_gas WHERE numero_protocolo IS NOT NULL;
  NEW.numero_protocolo := 'NG-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_protocolo_ng
BEFORE INSERT ON servicos_nacional_gas
FOR EACH ROW WHEN (NEW.numero_protocolo IS NULL)
EXECUTE FUNCTION generate_protocolo_ng();
```

### 2. Interface — `src/pages/MedicaoTerceirizada/Servicos.tsx`

- Adicionar `numero_protocolo` à interface `ServicoNacionalGas`
- Incluir na query de busca
- Adicionar coluna "Protocolo" na tabela (primeira coluna após checkbox)

### 3. Detalhes — `src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx`

- Exibir o número de protocolo no cabeçalho do dialog

### 4. PDF — `src/lib/exportRegistroAtendimento.ts`

- Incluir número de protocolo no cabeçalho do PDF

### 5. Coletor — `src/pages/ColetorServicosTerceirizados.tsx`

- Exibir protocolo na listagem e detalhes do serviço
