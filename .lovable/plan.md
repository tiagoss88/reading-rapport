
## Objetivo

Adicionar uma nova aba **"GTI"** dentro de `/medicao-terceirizada/leituras` para armazenar mensalmente a planilha enviada pela GTI com dados de coleta dos clientes de CE e BA (leitura anterior + janela de coleta do mês corrente), mantendo histórico por competência.

## Estrutura da tabela (banco)

Nova tabela `gti_leituras_mensais`:

- `uf` (text, CE ou BA)
- `condominio` (text)
- `leitura_anterior` (date) — data da coleta do mês anterior (informada pela GTI)
- `prazo_inicial` (date) — início da janela de coleta do mês corrente
- `prazo_final` (date) — fim da janela de coleta do mês corrente
- `mes_referencia` (int, 1–12) e `ano_referencia` (int) — competência
- `importado_por` (uuid), `importado_em` (timestamp)
- padrão: `id`, `created_at`, `updated_at`

Índices: `(ano_referencia, mes_referencia)`, `(uf)`.
Unicidade: `(uf, condominio, ano_referencia, mes_referencia)` — reimportar o mesmo mês sobrescreve o registro (upsert).

RLS + GRANT:
- Admin e gestores: full CRUD
- Demais usuários autenticados: apenas leitura
- `service_role`: ALL

## UI

### Nova aba "GTI" em `MedicaoTerceirizada/Leituras.tsx`
Ao lado das abas existentes. Ao entrar:

- Filtros no topo: **Mês/Ano de referência** (default: mês corrente), **UF** (Todas / CE / BA), busca por condomínio.
- Botão **"Importar planilha (Excel/CSV)"** (admin/gestor apenas).
- Botão **"Exportar CSV"** do que está filtrado.
- Tabela compacta (padrão do sistema, `text-xs`, `h-9`) com colunas:
  `UF | Condomínio | Leitura anterior | Prazo inicial | Prazo final | Importado em | Ações`
- Ações por linha: editar datas (dialog), excluir (admin).

### Diálogo de importação
- Aceita `.xlsx` e `.csv`.
- Seleção obrigatória de **Mês** e **Ano de referência** antes de importar.
- Cabeçalhos esperados (case-insensitive, com aliases):
  `UF | CONDOMINIO | LEITURA ANTERIOR | PRAZO INICIAL | PRAZO FINAL`
- Validação:
  - UF deve ser CE ou BA (rejeita outras)
  - Datas parseadas com suporte a `dd/mm/yyyy` e serial Excel
  - Condomínio obrigatório; normaliza prefixo `BA ` conforme regra do projeto
- Pré-visualização das primeiras 10 linhas + contagem total antes de confirmar.
- Upsert em lote na chave `(uf, condominio, ano_referencia, mes_referencia)`; relatório final: X inseridos, Y atualizados, Z rejeitados (com motivo).

## Arquivos a alterar/criar

- Migração: nova tabela `gti_leituras_mensais` com GRANTs, RLS, trigger `update_updated_at_column`.
- `src/pages/MedicaoTerceirizada/Leituras.tsx` — adicionar aba "GTI".
- `src/components/medicao-terceirizada/gti/GtiTab.tsx` — tabela + filtros + ações.
- `src/components/medicao-terceirizada/gti/ImportarGtiDialog.tsx` — parser xlsx/csv (usa `xlsx` já no projeto) + upsert.
- `src/hooks/useGtiLeituras.ts` — query/mutations (React Query).

## Fora do escopo

- Não altera coletor nem tela de leituras existente.
- Não cria relacionamento automático com `clientes`/`empreendimentos` (só texto do condomínio + UF); podemos evoluir depois se quiser vincular.
