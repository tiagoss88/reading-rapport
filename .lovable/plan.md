# Auditoria do relatório RDO de Serviços

Você citou três serviços do Condomínio Mater Domini (aptos 702, 902 e 904), tipo "CONJUNTO DE MEDICAO", status executado, que não aparecem no relatório com UF BA. Não consigo consultar o banco de produção pelas ferramentas daqui, então o plano começa por uma verificação real dos dados e só depois corrige.

## O que já está confirmado no código

Lendo `useRelatorioServicos.tsx` e `FiltrosRelatorio.tsx`:

- O relatório usa uma **janela de datas obrigatória**, que por padrão começa em "um mês atrás" e vai até hoje. Registros com data efetiva fora dessa janela são descartados.
- A data efetiva é `data_agendamento` → `data_solicitacao` → `created_at`. Um serviço executado com agendamento antigo cai fora da janela padrão.
- O filtro **UF não é exibido na tela do RDO**, mas o código continua aplicando `ufFiltro` se ele ficou definido ao usar outro relatório. Ou seja: pode haver um filtro de UF ativo e invisível.
- A lista do filtro "Tipo de Serviço" vem da tabela `tipos_servico` (Instalação, Leitura Extra, Manutenção, Troca de Medidor, Visita Técnica, Vistoria). "CONJUNTO DE MEDICAO" não está nessa lista — os tipos reais dos serviços não batem com as opções oferecidas.
- Existe uma exclusão automática de qualquer tipo que contenha "leitura", o que remove silenciosamente serviços legítimos como "Leitura Extra".

## Passo 1 — Diagnóstico com os dados reais

Adicionar temporariamente um painel de diagnóstico (ou log detalhado) na geração do RDO que mostre, para a busca feita: total de registros retornados do banco, quantos foram removidos pelo filtro de data, pelo de UF, pelo de tipo e pela exclusão de "leitura". Com isso confirmamos exatamente qual filtro está eliminando os aptos 702, 902 e 904 antes de mudar a regra.

## Passo 2 — Correções previstas

1. **Filtro de UF visível no RDO**: exibir o seletor de UF na tela do RDO e limpar filtros que não pertencem ao relatório selecionado, para não haver filtro invisível ativo.
2. **Filtro de tipo de serviço baseado nos dados reais**: montar a lista de tipos a partir dos valores realmente existentes em `servicos_nacional_gas`, em vez da tabela `tipos_servico`.
3. **Remover a exclusão cega de "leitura"**: substituir por uma opção explícita ("incluir leituras") em vez de descartar silenciosamente.
4. **Janela de datas mais clara**: manter o padrão do mês corrente, mas com atalhos (mês atual, mês anterior, ano) e um aviso no topo do resultado indicando o período aplicado e quantos registros ficaram fora dele.
5. **Contador de conferência**: mostrar "X de Y serviços" no cabeçalho do relatório, para você perceber na hora quando algo foi filtrado.

## Passo 3 — Validação

Gerar o RDO com UF BA / status executado sem restrição de data e confirmar que os três apartamentos do Mater Domini aparecem, com bloco, apartamento, tipo, técnico e valor corretos, incluindo na exportação Excel/PDF.

## Detalhes técnicos

Arquivos afetados: `src/hooks/useRelatorioServicos.tsx` (contagens de diagnóstico, remoção do `.not(tipo_servico ilike %leitura%)`, paginação acima de 10.000 registros), `src/components/relatorios/FiltrosRelatorio.tsx` (UF no RDO, tipos vindos dos dados, reset de filtros ao trocar de relatório), `src/pages/Relatorios.tsx` (estado inicial dos filtros) e `src/components/relatorios/TabelaRelatorio.tsx` (contador e aviso de período).
