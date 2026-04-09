

## Redesign do PDF "Registro de Atendimento" conforme modelo HTML

### O que muda

Reescrever `src/lib/exportRegistroAtendimento.ts` para gerar um PDF com o layout profissional do modelo enviado:

### Página 1 — Relatório de Atendimento

1. **Header**: Título "RELATÓRIO DE ATENDIMENTO" à esquerda em azul (#007bff), data de geração e protocolo à direita. Linha azul separadora abaixo.

2. **Badge do tipo de serviço**: Retângulo azul arredondado com o tipo (ex: "TROCA DE MEDIDOR").

3. **Seção "Resumo da Atividade"**: Grid 2 colunas com label cinza uppercase em cima e valor em preto embaixo:
   - Condomínio/Local | Unidade (Bloco + Apto)
   - Estado | Cliente (morador)
   - Telefone | E-mail

4. **Seção "Observação do Técnico"**: Caixa com borda cinza, fundo branco, texto da observação com `splitTextToSize` para quebra automática.

5. **Seção "Informações de Pagamento e Cadastro"**: Grid 2 colunas — Forma de Pagamento, Valor, CPF/CNPJ (condicional, só aparece se houver dados).

6. **Área de assinatura**: Duas colunas lado a lado:
   - Esquerda: imagem da assinatura digital do cliente (carregada via fetch/base64) + linha + "Assinatura do Cliente"
   - Direita: nome do técnico + linha + "Responsável Técnico"

7. **Footer**: "Página X de Y — Relatório de Atendimento Gerado via Sistema Lovable"

### Página 2 — Anexo Fotográfico (condicional)

Só é gerada se houver fotos. Layout:
- Header igual à página 1, mas título "ANEXO FOTOGRÁFICO"
- Seção "Registros Realizados Durante o Atendimento"
- Grid 2x2 com fotos embutidas (carregadas como base64) com legenda "Registro 01", "Registro 02", etc.
- Footer com "Página 2 de 2 — Anexo Fotográfico"

### Detalhes técnicos

- **Arquivo**: `src/lib/exportRegistroAtendimento.ts` — reescrita completa
- Usa `jsPDF` diretamente (canvas drawing) em vez de `autoTable` para ter controle visual preciso
- Cores: azul `#007bff` (RGB 0,123,255) para títulos/badges/linhas, cinza `#666666` para labels
- Fotos são carregadas como base64 via `getBase64FromUrl` existente e embutidas com `doc.addImage`
- Interface `RegistroAtendimentoData` permanece igual (sem quebra de contrato)
- Nenhum outro arquivo precisa ser alterado

