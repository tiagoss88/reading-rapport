# Duas observações na OS: interna e do técnico

Hoje existe um único campo "Observação": o escritório escreve ao criar a OS, o técnico sobrescreve ao executar, e é ele que sai no Relatório de Atendimento do cliente.

## O que muda

- **Observação interna** (escritório e técnico): preenchida ao criar/editar o serviço. O técnico vê no coletor como aviso, só leitura. **Nunca sai no relatório do cliente.**
- **Observação do técnico** (cliente): preenchida pelo técnico ao fechar a OS. É a única que aparece no Relatório de Atendimento (PDF).
- Na tela de detalhes da execução as duas aparecem separadas e identificadas.
- Na importação da planilha, o texto que vinha em "Observação" passa a ir para a observação interna.
- Serviços antigos: o texto atual continua como está (observação do técnico), nada se perde.

## Ativação

Precisa rodar um pequeno script no banco (mesmo esquema do Estoque: copiar e rodar no editor SQL). Enquanto não for rodado, a tela continua funcionando como hoje, sem o campo interno.

## Detalhes técnicos

- `supabase/manual/observacao_interna.sql` (idempotente): `ALTER TABLE servicos_nacional_gas ADD COLUMN IF NOT EXISTS observacao_interna text;` + `NOTIFY pgrst`.
- `NovoServicoNacionalGasDialog` / `ServicoNacionalGasDialog`: campo "Observação interna" gravando `observacao_interna`; o campo `observacao` no admin vira "Observação do técnico (sai no relatório)".
- `ImportarPlanilhaDialog`: mapear observação da planilha para `observacao_interna`.
- `ExecucaoServicoTerceirizado`: card "Observação interna" (somente leitura) acima do campo do técnico; técnico continua gravando `observacao` (formato legado de fotos preservado).
- `DetalhesExecucaoDialog`: exibe as duas; PDF (`exportRegistroAtendimento`) segue usando só `observacao`.
- Proteção: se a coluna não existir (erro de coluna ausente), o envio é refeito sem `observacao_interna`, para não quebrar o cadastro.
- Serviço MCP `atualizar_servico`/`criar_servico`: aceitar `observacao_interna` opcional.
