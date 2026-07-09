## Diagnóstico

Verifiquei ao vivo:

- Tabela existe, GRANTs aplicados (`authenticated`, `service_role`).
- Constraint única `(uf, condominio, ano_referencia, mes_referencia)` está no lugar (upsert funciona).
- Endpoint `GET /rest/v1/gti_leituras_mensais` responde **200 OK** — o schema cache do PostgREST já enxerga a tabela.

Ou seja, o backend está OK. O erro "Could not find the table ... in the schema cache" que você continua vendo é do **cache do PostgREST anterior** ainda em memória no navegador/pré-visualização (a resposta de erro ficou em cache do React Query / SW).

## Correção

1. Forçar reload do schema do PostgREST de novo (idempotente e barato).
2. **Bump da versão do Service Worker + limpeza de caches** — o PWA guarda respostas antigas do Supabase (`/rest/v1/...`) e pode servir o 404 anterior mesmo depois do fix.
3. Sem alterações de UI/negócio.

### Migração
```sql
NOTIFY pgrst, 'reload schema';
```

### Frontend
- Em `src/pwa/registerSW.ts` (ou `vite.config.ts` PWA config): bump da versão do cache para invalidar entradas antigas do Supabase REST.
- Nada mais é alterado.

Depois: no navegador, **Ctrl+Shift+R** (hard reload) uma vez para pegar o novo SW. A importação da planilha volta a funcionar.