## Objetivo

Hoje as fotos do atendimento são guardadas dentro do texto da observação (`Fotos comprovante: url1, url2 | Obs: ...`). Isso faz os links aparecerem no campo de observação e torna a leitura das imagens frágil — se a observação for editada na tela administrativa, os links são perdidos, e o relatório pode não recuperar todas as fotos.

A solução é dar às fotos um campo próprio no banco, separado da observação.

## O que será feito

**1. Banco de dados**
- Criar a coluna `fotos_urls` (lista de imagens) na tabela de serviços da Nacional Gás.
- Migrar os registros existentes: extrair as URLs que hoje estão dentro da observação para a nova coluna e deixar na observação apenas o texto escrito pelo técnico.
- A extração cobre todos os formatos usados historicamente: URLs separadas por vírgula, por barra vertical, ou entre colchetes.

**2. Coleta (app do operador)**
- Ao finalizar a atividade, as fotos passam a ser salvas na coluna `fotos_urls`, e a observação recebe somente o texto digitado — sem links.

**3. Tela de detalhes do atendimento**
- A observação exibe apenas o texto.
- A seção "Registro Fotográfico" passa a ler a nova coluna, com fallback para o formato antigo caso algum registro não tenha sido migrado.
- Nova possibilidade de adicionar/remover fotos direto na tela de detalhes (mesmo padrão já usado no diálogo de edição de coleta).

**4. Edição administrativa do serviço**
- O campo de observação passa a editar somente o texto, sem risco de apagar as fotos.

**5. Relatório PDF de atendimento**
- Passa a receber a lista completa de fotos vinda da nova coluna, garantindo que todas as imagens apareçam no anexo fotográfico (2 por linha, com quebra de página automática — já suportado).

## Detalhes técnicos

- Migração: `ALTER TABLE public.servicos_nacional_gas ADD COLUMN fotos_urls text[] NOT NULL DEFAULT '{}'` + `UPDATE` com regexp para popular a coluna e limpar a observação. Sem novas políticas necessárias (a tabela já tem RLS e grants).
- Arquivos afetados: `ExecucaoServicoTerceirizado.tsx` (gravação), `DetalhesExecucaoDialog.tsx` (exibição + PDF), `ServicoNacionalGasDialog.tsx` (edição), `MedicaoTerceirizada/Servicos.tsx` (tipo/seleção), utilitário compartilhado de parse legado em `src/lib/`.
- Observação: a causa exata de "só uma foto no PDF" não pôde ser confirmada por consulta (o registro do MATER DOMINI 901 não retorna no ambiente consultado); o desenho acima elimina as causas prováveis (parse do texto e sobrescrita da observação) e mantém fallback para registros antigos.
