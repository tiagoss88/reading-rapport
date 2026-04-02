

## Melhorar o Resumo da Atividade na tela de execução

### Alteração: `src/components/medicao-terceirizada/ExecucaoServicoTerceirizado.tsx`

**O que muda no card "Resumo da Atividade" (linhas 206-237):**

Exibir **todos** os dados disponíveis do serviço com ícones interativos:

1. **Tipo de serviço** — Badge colorido com o tipo (ex: "VISITA TÉCNICA")
2. **Condomínio** — ícone `Building2`, nome do condomínio
3. **Bloco/Apto** — indentado abaixo do condomínio (já existe, manter)
4. **UF** — ícone `MapPin`, estado
5. **Morador** — ícone `User`, nome do cliente
6. **Telefone** — ícone `Phone`, número clicável (`tel:`) com cor primária
7. **Email** — ícone `Mail`, endereço clicável (`mailto:`) com cor primária
8. **Observação original** — ícone `FileText`, exibir `servico.observacao` se existir (observação que veio da solicitação, não a do técnico)

Todos os campos condicionais (só aparecem se o dado existir). Ícones clicáveis no telefone e email para facilitar a interação do operador.

### Imports a adicionar
- `Mail`, `MapPin`, `FileText` do lucide-react (alguns já importados)

### Resultado visual
Card compacto com todas as informações organizadas verticalmente, cada linha com ícone + dado, telefone e email clicáveis. Semelhante ao screenshot de referência mas com email e UF adicionados.

