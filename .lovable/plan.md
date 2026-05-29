# Comprovante de Pagamento (Cupom) — Botão ao lado de "Gerar PDF"

## Onde aparece
No `DetalhesExecucaoDialog` (Medição Terceirizada → Serviços → ver detalhes), ao lado do botão **Gerar PDF** (linha 140), adicionar um novo botão **Comprovante** com o mesmo estilo (outline, h-7, text-xs), ícone `Receipt` do lucide-react.

## Nova lib: `src/lib/exportComprovantePagamento.ts`
Função `exportarComprovantePagamento(dados)` que:
1. Cria um container offscreen (position fixed, left:-9999px) e injeta o HTML do cupom (350px de largura) exatamente conforme `comprovante_agasen_v3_final.html`:
   - Header com logo (`@/assets/agasen-logo.png` importado), dados da empresa fixos (AGASEN INSTALAÇÕES E SERVIÇOS LTDA / CNPJ 44.620.393/0001-01 / www.agasen.com.br).
   - Título "COMPROVANTE DE PAGAMENTO".
   - Linhas (JetBrains Mono): Protocolo, Data/Hora, Cliente, CPF/CNPJ, Condomínio, Unidade (bloco/apto), Serviço, Pagamento.
   - Caixa total com `valor_servico` formatado em `R$`.
   - QR code via `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.agasen.com.br` + textos "VISITE NOSSO SITE" / descrição.
   - Rodapé: "Obrigado pela confiança!" / "Gerado via Sistema".
2. Aguarda fontes (`document.fonts.ready`) e o carregamento da imagem do logo/QR.
3. Usa `html2canvas` (já presente nas libs do projeto via jsPDF? — caso não esteja, adicionar `html2canvas` e `jspdf`) para rasterizar e `jsPDF` para gerar PDF tamanho proporcional ao cupom (ex.: 80mm de largura, altura dinâmica) e fazer `save("comprovante-{protocolo}.pdf")`.
4. Remove o container do DOM.

Fontes Inter + JetBrains Mono são carregadas via `<link>` injetado no `<head>` se ainda não estiverem presentes; o estilo do cupom é aplicado inline (escopo `.agasen-receipt`) para não vazar tema do app.

## Integração no Dialog
- Importar a função e `Receipt` icon.
- Estado `gerandoComprovante`.
- Handler `handleGerarComprovante` que monta o payload a partir do `servico`:
  - `numero_protocolo` → "AG-XXXXXX" (fallback se vazio: traço).
  - `data_hora` → `format(servico.updated_at, 'dd/MM/yyyy HH:mm')`.
  - `cliente` → `morador_nome`.
  - `cpf_cnpj`, `condominio_nome_original`, `bloco`/`apartamento`, `tipo_servico`, `forma_pagamento`, `valor_servico`.
- Botão exibido somente quando `forma_pagamento` e `valor_servico` existirem (caso contrário desabilitado com tooltip "Sem pagamento registrado").

## Envio ao cliente
Mantém os fluxos atuais de envio (WhatsApp/e-mail) do Registro de Atendimento — o novo botão apenas gera/baixa o PDF do comprovante. Não altera lógica de envio. (Se desejado em outro momento, adicionamos um menu "Enviar comprovante por WhatsApp" reaproveitando o mesmo PDF.)

## Arquivos afetados
- `src/lib/exportComprovantePagamento.ts` (novo)
- `src/components/medicao-terceirizada/DetalhesExecucaoDialog.tsx` (adiciona botão e handler)
- `package.json` (se faltar, adicionar `html2canvas`)

## Notas técnicas
- Sem mudanças em banco/RLS.
- QR code via serviço externo (api.qrserver.com); se preferir offline, podemos trocar por lib `qrcode` (sugiro confirmar depois).
- O cupom usa cores fixas da marca (#26a9b5 / #003366) — escopadas, não afeta o design system.
