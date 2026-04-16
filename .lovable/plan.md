
Adicionar coluna "Origem" ao lado de "Protocolo" na listagem e atualizar dados existentes onde fonte = 'vinculado' para 'ngd'.

## Mudanças

### 1. `src/pages/MedicaoTerceirizada/Servicos.tsx`
- Adicionar coluna `<TableHead>Origem</TableHead>` logo após "Protocolo"
- Adicionar `<TableCell>` exibindo badge com a `fonte`:
  - `particular` → "Particular" (badge cinza)
  - `bg` → "BG" (badge azul)
  - `ngd` → "NGD" (badge verde)
  - vazio/null → "—"
- Atualizar `colSpan` da linha "Nenhum serviço encontrado" (+1)

### 2. Banco de dados (via insert tool)
```sql
UPDATE servicos_nacional_gas 
SET fonte = 'ngd' 
WHERE fonte = 'vinculado';
```

E normalizar variações comuns (case-insensitive) para os 3 valores padrão:
```sql
UPDATE servicos_nacional_gas SET fonte = 'ngd' WHERE LOWER(fonte) IN ('vinculado','vinculada');
UPDATE servicos_nacional_gas SET fonte = 'particular' WHERE LOWER(fonte) = 'particular';
UPDATE servicos_nacional_gas SET fonte = 'bg' WHERE LOWER(fonte) = 'bg';
```

Sem alteração de schema (coluna `fonte` já existe).
