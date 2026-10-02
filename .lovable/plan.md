# Número da OS na tela de Editar Serviço

## Objetivo
Exibir o número da OS (protocolo, ex. NG-000123) na tela de **Editar Serviço**, como campo somente leitura.

## Estado atual (verificado)
- O protocolo fica na coluna `numero_protocolo` de `servicos_nacional_gas` e já vem na linha do serviço carregada pela lista (`src/pages/MedicaoTerceirizada/Servicos.tsx` — linha 55), mas **não** é passado para o diálogo de edição.
- O diálogo `ServicoNacionalGasDialog.tsx` (`Props.servico`, linhas 69-88) não tem `numero_protocolo` e o cabeçalho mostra apenas "Editar Serviço" + condomínio (linhas 240-249).

## Mudanças
1. `src/components/medicao-terceirizada/ServicoNacionalGasDialog.tsx`
   - Adicionar `numero_protocolo?: string | null` no tipo do `servico` em `Props`.
   - No bloco de resumo sob o título (o mesmo que mostra o Condomínio), exibir o número da OS como campo somente leitura: label "Nº da OS" + valor em `Input readOnly` (ou texto), ao lado do condomínio. Se não houver protocolo, mostrar "—".
2. `src/pages/MedicaoTerceirizada/Servicos.tsx`
   - Nenhuma mudança no carregamento (o campo já vem na linha); o componente já repassa `selectedServico` inteiro, então o protocolo passa a fluir automaticamente para o diálogo.

## Escopo
- Só apresentação: campo apenas de leitura, sem alterar formulário, Zod, salvamento, banco ou protocolos.
- Sem script de banco.
