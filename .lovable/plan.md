
## Melhorar informacoes nos cards da Agenda Semanal

### O que muda
Atualizar os cards da agenda para exibir as informacoes no formato mostrado na imagem de referencia:

1. **Condominio** (nome em destaque, negrito)
2. **Rota - Bairro** (ex: "533 - SAO CRISTOVAO")
3. **Bloco/APT** (ex: "Bloco A - Apto 101", quando disponivel)
4. **Tipo de Servico** (ex: "INSTALACAO GERAL")
5. **Status** (badge colorido)

### Alteracoes

**1. `src/pages/MedicaoTerceirizada/Servicos.tsx`**
- Adicionar o campo `rota` na query do empreendimento: `empreendimento:empreendimentos_terceirizados(nome, endereco, rota)`

**2. `src/components/medicao-terceirizada/AgendaSemanal.tsx`**
- Atualizar a interface `ServicoNacionalGas` para incluir `rota` no tipo do empreendimento
- Reescrever a funcao `renderCard` para mostrar:
  - Linha 1: `condominio_nome_original` em negrito
  - Linha 2: Rota + Bairro (extraido do endereco do empreendimento)
  - Linha 3: Bloco/Apartamento (quando existir)
  - Linha 4: Tipo de servico em maiusculas
  - Linha 5: Badge de status

### Detalhes tecnicos
- O campo `rota` ja existe na tabela `empreendimentos_terceirizados` (tipo `number`)
- O bairro continuara sendo extraido do campo `endereco` do empreendimento
- Bloco e apartamento ja estao disponiveis nos dados (`servico.bloco`, `servico.apartamento`), so nao estavam sendo exibidos no card
