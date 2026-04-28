## Diagnóstico

A página **Medição → Serviços** e o relatório **RDO de Serviços** leem da mesma tabela (`servicos_nacional_gas`). A diferença é que a tela de Medição/Serviços aplica um filtro escondido na linha 127:

```ts
const servicosSemLeitura = servicos?.filter(
  s => !s.tipo_servico?.toLowerCase().includes('leitura')
)
```

Ou seja, ela **esconde** todos os registros cujo `tipo_servico` contém a palavra "leitura". O relatório RDO **não** aplica esse filtro, então traz tudo — e como a maioria dos registros importados via planilha tem `tipo_servico = "Leitura"` (vem da coluna TIPO da planilha do cliente), o relatório acaba mostrando quase só "Leitura".

Conclusão: o relatório está funcionando, mas falta o mesmo filtro/critério usado em Medição/Serviços para considerar apenas serviços "reais" (religação, religação automática, religação emergencial, desligamento, visita técnica, etc.) e excluir os registros de leitura.

## Plano

Aplicar no relatório **RDO de Serviços** o mesmo critério da tela Medição/Serviços: **excluir registros cujo `tipo_servico` contenha "leitura"**.

### Arquivo a alterar

- `src/hooks/useRelatorioServicos.tsx`

### Mudança

Após o `.select(...)` da query em `servicos_nacional_gas`, adicionar:

```ts
// Excluir registros de leitura — RDO trata só serviços
queryNacionalGas = queryNacionalGas.not('tipo_servico', 'ilike', '%leitura%');
```

Isso garante que o RDO mostre apenas:
- Religação
- Religação Automática
- Religação Emergencial
- Desligamento
- Visita Técnica
- Demais serviços cadastrados em Medição/Serviços

E não mais o tipo "Leitura" que vem das importações de planilha.

### Bônus (opcional, mas recomendado)

No filtro **Tipo de Serviço** do formulário (`FiltrosRelatorio.tsx`), o select hoje carrega **todos** os tipos da tabela `tipos_servico`. Se você quiser, posso também filtrar a lista para esconder qualquer item cujo nome contenha "leitura", deixando o select coerente com o que o relatório passa a retornar.

### Validação

Após a mudança, gerar o relatório RDO sem filtro de tipo deve listar somente serviços reais (religações, desligamentos, visitas técnicas, etc.), batendo com o que aparece em Medição → Serviços.