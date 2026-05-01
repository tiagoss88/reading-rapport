
# Atualizar Rotas BA + Ferramenta de Atualização de Rotas

## Parte 1: Atualizar rotas BA agora

Vou executar a atualização dos ~100 condomínios BA diretamente no banco via o client Supabase (mesmo padrão do `AdminAtualizarRotasCE`). Como o banco de produção é o externo (`mxoflglqsxupkzrbodkm`), a atualização será feita pela aplicação em si, usando o Supabase client que já aponta para o banco correto.

Criarei um script temporário na página `AdminAtualizarRotasCE` adaptado para BA, ou executarei via a própria ferramenta que será criada.

## Parte 2: Ferramenta de "Colar e Atualizar Rotas" no ConfiguracoesSistema

Adicionar um novo Card na página `ConfiguracoesSistema` com:

- **Select de UF** (BA, CE, PE, RN, etc.)
- **Textarea** para colar dados no formato "CONDOMINIO [tab] ROTA" (copia-cola direto do Excel/tabela)
- **Parser automático** que detecta colunas por tab/espaço e extrai nome + rota
- **Preview** mostrando as linhas parseadas antes de executar
- **Botão "Executar Atualização"** que faz o update direto via Supabase client (match por `UPPER(TRIM(nome))` + `uf`)
- **Log de resultados** mostrando: atualizados, já corretos, não encontrados

O fluxo é simples: cola os dados, escolhe a UF, vê o preview, confirma, e a ferramenta atualiza o banco em tempo real.

## Arquivos alterados

- `src/pages/ConfiguracoesSistema.tsx` -- adicionar Card "Atualizar Rotas" com textarea + parser + executor
