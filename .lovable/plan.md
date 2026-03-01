

## Gerar SQL de atualização de rotas BA

Vou criar os comandos SQL para você executar diretamente no Supabase SQL Editor, baseado nos dados colados.

### SQL a ser gerado

Um bloco `BEGIN; ... COMMIT;` com ~95 statements `UPDATE` no formato:

```sql
UPDATE empreendimentos_terceirizados 
SET rota = X 
WHERE UPPER(TRIM(nome)) = 'NOME' AND uf = 'BA';
```

### Implementação

Vou usar a **ferramenta de insert/update do Supabase** para executar os updates diretamente, ou gerar o SQL completo numa página existente para você copiar e colar.

Como são ~95 registros, a abordagem mais prática é executar os updates diretamente via a ferramenta SQL do Supabase disponível no projeto.

### Plano

1. Executar os ~95 UPDATE statements diretamente no banco via ferramenta SQL do Supabase

