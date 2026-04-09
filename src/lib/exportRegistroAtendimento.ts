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
}

// Colors
const BLUE: [number, number, number] = [0, 123, 255];
const DARK: [number, number, number] = [33, 37, 41];
const GRAY: [number, number, number] = [102, 102, 102];
const LIGHT_GRAY: [number, number, number] = [200, 200, 200];
const BG_GRAY: [number, number, number] = [248, 249, 250];

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

function drawHeader(doc: jsPDF, title: string, protocolo: string | null | undefined) {
  const pw = doc.internal.pageSize.getWidth();
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text(title, 20, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const rightX = pw - 20;
  doc.text(`Data: ${now}`, rightX, 16, { align: 'right' });
  if (protocolo) {
    doc.text(`Protocolo: ${protocolo}`, rightX, 22, { align: 'right' });
  }

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(20, 28, pw - 20, 28);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number, subtitle: string) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const y = ph - 12;

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(20, y - 4, pw - 20, y - 4);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Página ${pageNum} de ${totalPages} — ${subtitle}`, pw / 2, y, { align: 'center' });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text(title, 20, y);
  y += 2;
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.3);
  doc.line(20, y, 80, y);
  return y + 6;
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
  const tw = doc.getTextWidth(text) + 12;
  const h = 8;

  doc.setFillColor(...BLUE);
  doc.roundedRect(20, y - 5.5, tw, h, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.text(text, 26, y);

  return y + h + 4;
}

export async function exportarRegistroAtendimento(data: RegistroAtendimentoData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const contentW = pw - 40;
  const colW = contentW / 2 - 4;
  const hasPhotos = data.fotos_urls && data.fotos_urls.length > 0;
  const totalPages = hasPhotos ? 2 : 1;

  // ===== PAGE 1 =====
  drawHeader(doc, 'RELATÓRIO DE ATENDIMENTO', data.numero_protocolo);
  let y = 36;

  // Badge tipo serviço
  y = drawBadge(doc, data.tipo_servico.toUpperCase(), y);

  // Resumo da Atividade
  y = drawSectionTitle(doc, 'RESUMO DA ATIVIDADE', y);

  // Background box
  const resumoStartY = y - 2;
  const col1X = 24;
  const col2X = pw / 2 + 4;

  // Row 1: Condomínio | Unidade
  const unidade = [data.bloco, data.apartamento].filter(Boolean).join(' / ') || '—';
  const r1Left = drawLabelValue(doc, 'Condomínio / Local', data.condominio, col1X, y, colW);
  const r1Right = drawLabelValue(doc, 'Unidade (Bloco / Apto)', unidade, col2X, y, colW);
  y = Math.max(r1Left, r1Right) + 4;

  // Row 2: Estado | Cliente
  const r2Left = drawLabelValue(doc, 'Estado', data.uf || '—', col1X, y, colW);
  const r2Right = drawLabelValue(doc, 'Cliente', data.morador_nome || '—', col2X, y, colW);
  y = Math.max(r2Left, r2Right) + 4;

  // Row 3: Telefone | Email
  const r3Left = drawLabelValue(doc, 'Telefone', data.telefone || '—', col1X, y, colW);
  const r3Right = drawLabelValue(doc, 'E-mail', data.email || '—', col2X, y, colW);
  y = Math.max(r3Left, r3Right) + 4;

  // Row 4: Data Agendamento | Turno
  const dataAg = data.data_agendamento
    ? format(new Date(data.data_agendamento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    : '—';
  const turnoMap: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral' };
  const r4Left = drawLabelValue(doc, 'Data Agendamento', dataAg, col1X, y, colW);
  const r4Right = drawLabelValue(doc, 'Turno', turnoMap[data.turno ?? ''] || data.turno || '—', col2X, y, colW);
  y = Math.max(r4Left, r4Right) + 2;

  // Draw background behind resumo
  doc.setFillColor(...BG_GRAY);
  doc.setDrawColor(...LIGHT_GRAY);
  doc.roundedRect(20, resumoStartY, contentW + 0, y - resumoStartY, 2, 2, 'FD');

  // Redraw labels/values on top of background (jsPDF draws in order so we re-render)
  // Instead of re-rendering, let's draw background first next time.
  // For simplicity, we'll restructure: draw bg first, then content.

  // Actually jsPDF doesn't support z-index. Let's rebuild page 1 properly.
  // We'll calculate heights first, then draw.

  // --- RESTART page 1 with proper layering ---
  doc.deletePage(1);
  doc.addPage();
  // jsPDF adds pages at end, we need page 1. Actually deletePage + addPage leaves us at page 1.

  drawHeader(doc, 'RELATÓRIO DE ATENDIMENTO', data.numero_protocolo);
  y = 36;
  y = drawBadge(doc, data.tipo_servico.toUpperCase(), y);
  y = drawSectionTitle(doc, 'RESUMO DA ATIVIDADE', y);

  // Draw bg box first (estimate height)
  const boxY = y - 2;
  const boxH = 62;
  doc.setFillColor(...BG_GRAY);
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.2);
  doc.roundedRect(20, boxY, contentW, boxH, 2, 2, 'FD');

  // Content on top
  let cy = y;
  drawLabelValue(doc, 'Condomínio / Local', data.condominio, col1X, cy, colW);
  drawLabelValue(doc, 'Unidade (Bloco / Apto)', unidade, col2X, cy, colW);
  cy += 14;
  drawLabelValue(doc, 'Estado', data.uf || '—', col1X, cy, colW);
  drawLabelValue(doc, 'Cliente', data.morador_nome || '—', col2X, cy, colW);
  cy += 14;
  drawLabelValue(doc, 'Telefone', data.telefone || '—', col1X, cy, colW);
  drawLabelValue(doc, 'E-mail', data.email || '—', col2X, cy, colW);
  cy += 14;
  drawLabelValue(doc, 'Data Agendamento', dataAg, col1X, cy, colW);
  drawLabelValue(doc, 'Turno', turnoMap[data.turno ?? ''] || data.turno || '—', col2X, cy, colW);

  y = boxY + boxH + 8;

  // Observação do Técnico
  if (data.observacao_texto) {
    y = drawSectionTitle(doc, 'OBSERVAÇÃO DO TÉCNICO', y);
    const obsLines = doc.splitTextToSize(data.observacao_texto, contentW - 8);
    const obsH = Math.max(obsLines.length * 4.5 + 8, 16);

    doc.setDrawColor(...LIGHT_GRAY);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.roundedRect(20, y - 2, contentW, obsH, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(obsLines, 24, y + 4);

    y += obsH + 8;
  }

  // Informações de Pagamento
  if (data.forma_pagamento || data.valor_servico != null || data.cpf_cnpj) {
    y = drawSectionTitle(doc, 'INFORMAÇÕES DE PAGAMENTO E CADASTRO', y);

    const payBoxY = y - 2;
    const payBoxH = 18;
    doc.setFillColor(...BG_GRAY);
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.2);
    doc.roundedRect(20, payBoxY, contentW, payBoxH, 2, 2, 'FD');

    const valorStr = data.valor_servico != null
      ? `R$ ${Number(data.valor_servico).toFixed(2).replace('.', ',')}`
      : '—';

    drawLabelValue(doc, 'Forma de Pagamento', data.forma_pagamento || '—', col1X, y, colW);
    drawLabelValue(doc, 'Valor do Serviço', valorStr, col2X, y, colW);
    y += payBoxH + 2;

    if (data.cpf_cnpj) {
      drawLabelValue(doc, 'CPF / CNPJ', data.cpf_cnpj, col1X, y, colW);
      y += 14;
    } else {
      y += 4;
    }
  }

  // Assinatura
  if (y > 220) {
    doc.addPage();
    drawHeader(doc, 'RELATÓRIO DE ATENDIMENTO', data.numero_protocolo);
    y = 36;
  }

  y = drawSectionTitle(doc, 'ASSINATURAS', y);

  const sigY = y;
  const sigColW = contentW / 2 - 8;

  // Left: Client signature
  if (data.assinatura_url) {
    const imgData = await getBase64FromUrl(data.assinatura_url);
    if (imgData) {
      doc.addImage(imgData, 'PNG', col1X, sigY, 70, 25);
    }
  }
  const lineY = sigY + 28;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);
  doc.line(col1X, lineY, col1X + sigColW, lineY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Assinatura do Cliente', col1X + sigColW / 2, lineY + 5, { align: 'center' });

  // Right: Technician
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

  // ===== PAGE 2 — Fotos =====
  if (hasPhotos && data.fotos_urls) {
    doc.addPage();
    drawHeader(doc, 'ANEXO FOTOGRÁFICO', data.numero_protocolo);
    let fy = 36;
    fy = drawSectionTitle(doc, 'REGISTROS REALIZADOS DURANTE O ATENDIMENTO', fy);

    const imgW = (contentW - 8) / 2;
    const imgH = 70;
    let col = 0;

    for (let i = 0; i < data.fotos_urls.length; i++) {
      const imgData = await getBase64FromUrl(data.fotos_urls[i]);
      const ix = col === 0 ? 20 : 20 + imgW + 8;

      if (imgData) {
        doc.setDrawColor(...LIGHT_GRAY);
        doc.setLineWidth(0.2);
        doc.roundedRect(ix, fy, imgW, imgH, 2, 2, 'D');
        try {
          doc.addImage(imgData, 'JPEG', ix + 2, fy + 2, imgW - 4, imgH - 12);
        } catch {
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.text('Imagem indisponível', ix + imgW / 2, fy + imgH / 2, { align: 'center' });
        }
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(`Registro ${String(i + 1).padStart(2, '0')}`, ix + imgW / 2, fy + imgH - 4, { align: 'center' });

      col++;
      if (col >= 2) {
        col = 0;
        fy += imgH + 6;
        if (fy + imgH > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          drawHeader(doc, 'ANEXO FOTOGRÁFICO', data.numero_protocolo);
          fy = 36;
        }
      }
    }
  }

  // Draw footers on all pages
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const sub = i === 1 ? 'Relatório de Atendimento Gerado via Sistema' : 'Anexo Fotográfico';
    drawFooter(doc, i, pages, sub);
  }

  const nomeCondominio = data.condominio.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const dataFile = format(new Date(), 'yyyyMMdd_HHmmss');
  doc.save(`registro_atendimento_${dataFile}_${nomeCondominio}.pdf`);
}
