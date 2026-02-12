

## Painel de alertas para servicos urgentes (Religacao/Desligamento)

### Objetivo
Criar um sistema de alertas visuais que destaque servicos com prazo critico, garantindo que Religacoes (48h uteis), Desligamentos (48h uteis) e Religacoes Emergenciais (24h uteis) nunca sejam esquecidos.

### Como vai funcionar

O sistema vai calcular automaticamente o prazo restante com base na **data de solicitacao** (`data_solicitacao`) de cada servico, considerando apenas dias uteis (segunda a sexta). Os servicos serao classificados em 3 niveis:

- **Vermelho (Vencido)**: prazo ja expirou
- **Laranja (Critico)**: faltam menos de 8 horas uteis
- **Amarelo (Atencao)**: dentro do prazo, mas com menos da metade restante

Apenas servicos com status **pendente** ou **agendado** (nao executados/cancelados) serao monitorados.

### O que sera adicionado

**1. Novo componente: Painel de Urgencias**
- Arquivo: `src/components/medicao-terceirizada/PainelUrgencias.tsx`
- Um card com icone de alerta que lista os servicos urgentes ordenados por prazo (mais urgente primeiro)
- Cada item mostra: condominio, apartamento, tipo de servico, tempo restante (ex: "Vencido ha 3h", "Falta 12h uteis") e um badge colorido com o nivel de urgencia
- Botao para abrir o servico diretamente para edicao/agendamento
- Funcao utilitaria interna para calcular horas uteis entre duas datas

**2. Pagina de Servicos (`src/pages/MedicaoTerceirizada/Servicos.tsx`)**
- O painel de urgencias sera exibido no topo da pagina, acima das tabs, quando houver servicos urgentes
- Ficara visivel junto ao alerta de servicos nao associados ja existente

**3. Dashboard (`src/pages/Dashboard.tsx`)**
- Adicionar um card resumo mostrando a quantidade de servicos vencidos e criticos, com link direto para a pagina de Servicos
- Usar cores vermelha/laranja para chamar atencao imediata

### Regras de prazo

| Tipo de Servico | Prazo |
|---|---|
| Religacao Emergencial | 24 horas uteis |
| Religacao | 48 horas uteis |
| Desligamento | 48 horas uteis |

A deteccao do tipo sera feita verificando se o campo `tipo_servico` contem as palavras-chave (case-insensitive): "religacao emergencial", "religacao" ou "desligamento".

### Detalhes tecnicos

- Criar funcao `calcularHorasUteisRestantes(dataSolicitacao: Date, prazoHoras: number): number` que calcula quantas horas uteis restam, considerando horario comercial (8h-18h, seg-sex)
- A query de servicos ja existente sera reutilizada -- o componente recebe os servicos como prop e filtra localmente
- Tipos de servico serao detectados por `includes` no texto, tratando acentos e case (ex: "RELIGAÇÃO EMERGENCIAL", "religacao emergencial")
- Os servicos sem `data_solicitacao` serao tratados como urgentes (exibidos com alerta de "data nao informada")
