import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistroAtendimentoData {
  numero_protocolo?: string | null;
  morador_nome?: string | null;
  condominio: string;
  endereco?: string | null;
  bloco?: string | null;
  apartamento?: string | null;
  uf?: string;
  telefone?: string | null;
  email?: string | null;
  tipo_servico: string;
  data_agendamento?: string | null;
  data_solicitacao?: string | null;
  turno?: string | null;
  status_atendimento: string;
  tecnico_nome?: string | null;
  observacao_texto?: string;
  forma_pagamento?: string | null;
  valor_servico?: number | null;
  cpf_cnpj?: string | null;
  assinatura_url?: string | null;
  fotos_urls?: string[];
  data_execucao?: string | null;
}

const BLUE: [number, number, number] = [0, 123, 255];
const DARK: [number, number, number] = [33, 37, 41];
const GRAY: [number, number, number] = [102, 102, 102];
const LIGHT_GRAY: [number, number, number] = [200, 200, 200];
const BG_GRAY: [number, number, number] = [248, 249, 250];
const LINE_GRAY: [number, number, number] = [238, 238, 238];

// ~2cm margins (≈22.7mm, using 22 for clean number)
const MARGIN = 22;
const LEFT = MARGIN;
const ROW_H = 12;
const SECTION_GAP = 10;
const BOX_PAD = 4;
const FOOTER_FONT = 9;
const FOOTER_BOTTOM_PAD = 16; // ~1cm from bottom edge

async function getBase64FromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawHeader(doc: jsPDF, title: string, protocolo: string | null | undefined, dataGerado?: string) {
  const pw = doc.internal.pageSize.getWidth();
  const geradoText = dataGerado || format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text(title, LEFT, MARGIN + 2);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const rightX = pw - LEFT;
  doc.text(`Gerado em: ${geradoText}`, rightX, MARGIN - 4, { align: 'right' });
  if (protocolo) {
    doc.text(`Protocolo: ${protocolo}`, rightX, MARGIN + 2, { align: 'right' });
  }

  const lineY = MARGIN + 8;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(LEFT, lineY, pw - LEFT, lineY);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number, subtitle: string) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const y = ph - FOOTER_BOTTOM_PAD;

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(LEFT, y - 5, pw - LEFT, y - 5);

  doc.setFontSize(FOOTER_FONT);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Página ${pageNum} de ${totalPages} — ${subtitle}`, pw / 2, y, { align: 'center' });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text(title, LEFT, y);
  y += 2;
  doc.setDrawColor(...LINE_GRAY);
  doc.setLineWidth(0.2);
  doc.line(LEFT, y, pw - LEFT, y);
  return y + SECTION_GAP;
}

function drawLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number, maxW: number): number {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text(label.toUpperCase(), x, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const lines = doc.splitTextToSize(value || '—', maxW);
  doc.text(lines, x, y + 5);
  return y + 5 + lines.length * 4;
}

function drawBadge(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const tw = doc.getTextWidth(text) + 14;
  const h = 8;

  doc.setFillColor(...BLUE);
  doc.roundedRect(LEFT, y - 5.5, tw, h, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.text(text, LEFT + 7, y);

  return y + h + BOX_PAD;
}

function drawBox(doc: jsPDF, x: number, y: number, w: number, h: number, fill: [number, number, number] = BG_GRAY) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...LINE_GRAY);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
}

function getContentBottom(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight() - FOOTER_BOTTOM_PAD - 8;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, data: RegistroAtendimentoData, dataGerado?: string): number {
  if (y + needed > getContentBottom(doc)) {
    doc.addPage();
    drawHeader(doc, 'RELATÓRIO DE ATENDIMENTO', data.numero_protocolo, dataGerado);
    return MARGIN + 16;
  }
  return y;
}

export async function exportarRegistroAtendimento(data: RegistroAtendimentoData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const contentW = pw - MARGIN * 2;
  const colW = contentW / 2 - 4;
  const col1X = LEFT + BOX_PAD;
  const col2X = pw / 2 + 4;
  const startY = MARGIN + 16;

  // Use data_execucao (when operator filled the form) for "Gerado em"
  const dataGerado = data.data_execucao
    ? format(new Date(data.data_execucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const turnoMap: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral' };
  const unidade = [data.bloco, data.apartamento].filter(Boolean).join(' / ') || '—';
  const dataAg = data.data_agendamento
    ? format(new Date(data.data_agendamento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    : '—';

  // ===== PAGE 1 =====
  drawHeader(doc, 'RELATÓRIO DE ATENDIMENTO', data.numero_protocolo, dataGerado);
  let y = startY;

  // Badge
  y = drawBadge(doc, data.tipo_servico.toUpperCase(), y);

  // === RESUMO DA ATIVIDADE ===
  y = drawSectionTitle(doc, 'RESUMO DA ATIVIDADE', y);

  const resumoRows = 4;
  const resumoBoxH = resumoRows * ROW_H + BOX_PAD * 2;
  const resumoBoxY = y - 2;

  drawBox(doc, LEFT, resumoBoxY, contentW, resumoBoxH);

  let cy = resumoBoxY + BOX_PAD + 2;
  drawLabelValue(doc, 'Condomínio / Local', data.condominio, col1X, cy, colW);
  drawLabelValue(doc, 'Unidade (Bloco / Apto)', unidade, col2X, cy, colW);
  cy += ROW_H;
  drawLabelValue(doc, 'Estado', data.uf || '—', col1X, cy, colW);
  drawLabelValue(doc, 'Cliente', data.morador_nome || '—', col2X, cy, colW);
  cy += ROW_H;
  drawLabelValue(doc, 'Telefone', data.telefone || '—', col1X, cy, colW);
  drawLabelValue(doc, 'E-mail', data.email || '—', col2X, cy, colW);
  cy += ROW_H;
  drawLabelValue(doc, 'Data Agendamento', dataAg, col1X, cy, colW);
  drawLabelValue(doc, 'Turno', turnoMap[data.turno ?? ''] || data.turno || '—', col2X, cy, colW);

  y = resumoBoxY + resumoBoxH + SECTION_GAP;

  // === OBSERVAÇÃO DO TÉCNICO ===
  if (data.observacao_texto) {
    y = checkPageBreak(doc, y, 50, data, dataGerado);
    y = drawSectionTitle(doc, 'OBSERVAÇÃO DO TÉCNICO', y);

    doc.setFontSize(9);
    const obsLines = doc.splitTextToSize(data.observacao_texto, contentW - BOX_PAD * 2);
    const obsH = Math.max(obsLines.length * 4.5 + BOX_PAD * 2, 18);

    drawBox(doc, LEFT, y - 2, contentW, obsH, [255, 255, 255]);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(obsLines, col1X, y + BOX_PAD);

    y += obsH + SECTION_GAP;
  }

  // === INFORMAÇÕES DE PAGAMENTO ===
  if (data.forma_pagamento || data.valor_servico != null || data.cpf_cnpj) {
    y = checkPageBreak(doc, y, 40, data, dataGerado);
    y = drawSectionTitle(doc, 'INFORMAÇÕES DE PAGAMENTO E CADASTRO', y);

    const hasCpf = !!data.cpf_cnpj;
    const payRows = hasCpf ? 2 : 1;
    const payBoxH = payRows * ROW_H + BOX_PAD * 2;
    const payBoxY = y - 2;

    drawBox(doc, LEFT, payBoxY, contentW, payBoxH);

    let py = payBoxY + BOX_PAD + 2;
    const valorStr = data.valor_servico != null
      ? `R$ ${Number(data.valor_servico).toFixed(2).replace('.', ',')}`
      : '—';
    drawLabelValue(doc, 'Forma de Pagamento', data.forma_pagamento || '—', col1X, py, colW);
    drawLabelValue(doc, 'Valor do Serviço', valorStr, col2X, py, colW);

    if (hasCpf) {
      py += ROW_H;
      drawLabelValue(doc, 'CPF / CNPJ', data.cpf_cnpj!, col1X, py, colW);
    }

    y = payBoxY + payBoxH + SECTION_GAP;
  }

  // === ASSINATURAS ===
  y = checkPageBreak(doc, y, 50, data, dataGerado);
  y = drawSectionTitle(doc, 'ASSINATURAS', y);

  const sigY = y;
  const sigColW = contentW / 2 - 8;

  if (data.assinatura_url) {
    const imgData = await getBase64FromUrl(data.assinatura_url);
    if (imgData) {
      doc.addImage(imgData, 'PNG', col1X, sigY, 70, 25);
    }
  }

  const lineY = sigY + 34;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);
  doc.line(col1X, lineY, col1X + sigColW, lineY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Assinatura do Cliente', col1X + sigColW / 2, lineY + 5, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(data.tecnico_nome || '—', col2X + sigColW / 2, sigY + 14, { align: 'center' });

  doc.setDrawColor(...DARK);
  doc.line(col2X, lineY, col2X + sigColW, lineY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Responsável Técnico', col2X + sigColW / 2, lineY + 5, { align: 'center' });

  // ===== FOTOS =====
  const hasPhotos = data.fotos_urls && data.fotos_urls.length > 0;
  if (hasPhotos && data.fotos_urls) {
    doc.addPage();
    drawHeader(doc, 'ANEXO FOTOGRÁFICO', data.numero_protocolo);
    let fy = startY;
    fy = drawSectionTitle(doc, 'REGISTROS REALIZADOS DURANTE O ATENDIMENTO', fy);

    const imgW = (contentW - 8) / 2;
    const imgH = 70;
    let col = 0;
    const maxY = getContentBottom(doc);

    for (let i = 0; i < data.fotos_urls.length; i++) {
      const imgData = await getBase64FromUrl(data.fotos_urls[i]);
      const ix = col === 0 ? LEFT : LEFT + imgW + 8;

      if (imgData) {
        doc.setDrawColor(...LIGHT_GRAY);
        doc.setLineWidth(0.2);
        doc.roundedRect(ix, fy, imgW, imgH, 2, 2, 'D');
        try {
          doc.addImage(imgData, 'JPEG', ix + 2, fy + 2, imgW - 4, imgH - 14);
        } catch {
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.text('Imagem indisponível', ix + imgW / 2, fy + imgH / 2, { align: 'center' });
        }
      }

      // Caption
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GRAY);
      doc.text(`Registro ${String(i + 1).padStart(2, '0')}`, ix + imgW / 2, fy + imgH - 4, { align: 'center' });

      col++;
      if (col >= 2) {
        col = 0;
        fy += imgH + 8;
        if (fy + imgH > maxY) {
          doc.addPage();
          drawHeader(doc, 'ANEXO FOTOGRÁFICO', data.numero_protocolo);
          fy = startY;
        }
      }
    }
  }

  // Footers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const sub = i === 1
      ? 'Relatório de Atendimento Gerado via Sistema Lovable'
      : 'Anexo Fotográfico';
    drawFooter(doc, i, pages, sub);
  }

  const nomeCondominio = data.condominio.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const dataFile = format(new Date(), 'yyyyMMdd_HHmmss');
  doc.save(`registro_atendimento_${dataFile}_${nomeCondominio}.pdf`);
}
