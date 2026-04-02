

## Redesign do DetalhesExecucaoDialog — exibição completa e profissional

### O que muda

Reorganizar o dialog para mostrar **todos os dados do serviço** (não apenas os dados de execução), divididos em seções visuais claras com cards, separadores e ícones. O layout atual mostra apenas observação, fotos, pagamento e assinatura. O novo layout terá:

### Estrutura das seções

1. **Cabeçalho** — Badge com tipo de serviço + status colorido
2. **Dados do Local** — Condomínio, endereço, bloco/apto, UF (ícones: `Building2`, `MapPin`, `Home`)
3. **Dados do Cliente** — Nome do morador, telefone, email (ícones: `User`, `Phone`, `Mail`)
4. **Dados do Serviço** — Data agendamento, turno, técnico responsável (ícones: `Calendar`, `Clock`, `Wrench`)
5. **Execução do Técnico** — Observação do técnico (ícone: `FileText`)
6. **Registro Fotográfico** — Grid de fotos (ícone: `Camera`)
7. **Dados Financeiros** — Forma de pagamento (badge), valor, CPF/CNPJ (ícones: `CreditCard`, `DollarSign`, `User`)
8. **Assinatura do Cliente** — Imagem da assinatura (ícone: `PenTool`)

### Arquivo impactado

**`src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx`**

- Manter a query existente (já traz todos os campos necessários via `*` + joins)
- Redesenhar o conteúdo do ScrollArea com as 8 seções acima
- Cada seção usa um card leve (`bg-muted/50 rounded-lg p-3`) com título em negrito + ícone
- Dados do local e cliente em linhas compactas com ícones alinhados
- Status com badge colorido (verde=executado, amarelo=pendente, etc.)
- Separadores visuais (`Separator`) entre grupos de seções
- Manter o botão "Gerar PDF" e toda a lógica existente

### Detalhes técnicos

- Imports adicionais: `Building2`, `MapPin`, `Home`, `Phone`, `Mail`, `Calendar`, `Clock`, `Wrench`, `Separator` 
- Usar `format` de `date-fns` para formatar datas em dd/MM/yyyy
- Campos condicionais — só renderizam se o dado existir
- Componente `Section` existente será reutilizado com leve ajuste visual (fundo sutil)

