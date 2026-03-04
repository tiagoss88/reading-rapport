

## Diagnóstico: Login falha porque o backend mudou

Ao ativar o Lovable Cloud, o `.env` foi atualizado para apontar para um novo projeto backend (`cfyhskxjvvqpnnzsebud`), mas todos os seus dados, usuários e configurações estão no projeto original (`mxoflglqsxupkzrbodkm`).

## Solução: Restaurar conexão com o projeto original

Alterar o `.env` para apontar de volta ao projeto original:

```
VITE_SUPABASE_PROJECT_ID="mxoflglqsxupkzrbodkm"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14b2ZsZ2xxc3h1cGt6cmJvZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjM1MzgsImV4cCI6MjA3MDUzOTUzOH0.zToDlCEsT7TCAnQslnFVRRiygRveOCXf33TAuG_tdF8"
VITE_SUPABASE_URL="https://mxoflglqsxupkzrbodkm.supabase.co"
```

**Porém**, o `.env` é gerenciado automaticamente pelo Lovable Cloud e não pode ser editado diretamente. Existem duas alternativas:

### Opção A — Criar a tabela `notificacoes_medidores` no projeto original
Executar a migration SQL diretamente no projeto original (via painel do Supabase `mxoflglqsxupkzrbodkm`) e manter tudo conectado lá. Eu ajusto o código para não depender do Cloud.

### Opção B — Migrar dados do projeto antigo para o Cloud
Exportar todos os dados e usuários do projeto antigo para o novo Cloud. Processo demorado e complexo.

**Recomendação**: Opção A — manter o projeto original e criar a tabela de notificações lá. É a solução mais rápida e segura.

### Arquivos a modificar
- Restaurar as credenciais do projeto original no código (contornando o `.env` se necessário)
- Garantir que a tabela `notificacoes_medidores` exista no projeto original

