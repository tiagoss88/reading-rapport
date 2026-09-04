import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCpfCnpj, formatFormaPagamento, formatTelefone } from '@/lib/formatters';
import agasenLogo from '@/assets/agasen-logo.png';

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

type RGB = [number, number, number];

const NAVY: RGB = [16, 37, 63];
const BLUE: RGB = [8, 119, 201];
const CYAN: RGB = [49, 183, 232];
const INK: RGB = [23, 35, 52];
const MUTED: RGB = [107, 119, 135];
const LINE: RGB = [223, 230, 238];
const SOFT: RGB = [244, 247, 250];
const BADGE_BG: RGB = [234, 245, 252];
const WHITE: RGB = [255, 255, 255];

const MARGIN = 15;
const LEFT = MARGIN;
const FOOTER_BOTTOM = 12;

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

function contentWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth() - MARGIN * 2;
}

function getContentBottom(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight() - FOOTER_BOTTOM - 8;
}

function drawTopBar(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const steps = 60;
  const w = pw / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    let c: RGB;
    if (t < 0.5) {
      const k = t / 0.5;
      c = [
        NAVY[0] + (BLUE[0] - NAVY[0]) * k,
        NAVY[1] + (BLUE[1] - NAVY[1]) * k,
        NAVY[2] + (BLUE[2] - NAVY[2]) * k,
      ];
    } else {
      const k = (t - 0.5) / 0.5;
      c = [
        BLUE[0] + (CYAN[0] - BLUE[0]) * k,
        BLUE[1] + (CYAN[1] - BLUE[1]) * k,
        BLUE[2] + (CYAN[2] - BLUE[2]) * k,
      ];
    }
    doc.setFillColor(c[0], c[1], c[2]);
    doc.rect(i * w, 0, w + 0.3, 1.6, 'F');
  }
}

function drawLogo(doc: jsPDF, logo: string | null, x: number, y: number) {
  const boxH = 12;
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const ratio = props.width / props.height;
      const h = boxH;
      const w = h * ratio;
      doc.addImage(logo, 'PNG', x, y, w, h);
      return;
    } catch {
      /* fallback below */
    }
  }
  doc.setFillColor(...NAVY);
  doc.roundedRect(x, y, 11, 11, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('A', x + 5.5, y + 7.8, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('AGASEN', x + 14, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text('Instalações e Serviços em Gás', x + 14, y + 9);
}

function drawHeader(
  doc: jsPDF,
  logo: string | null,
  title: string,
  subtitle: string,
  protocolo?: string | null,
): number {
  const pw = doc.internal.pageSize.getWidth();
  drawTopBar(doc);
  const top = MARGIN;

  drawLogo(doc, logo, LEFT, top);

  const rightX = pw - MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text(title, rightX, top + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(subtitle, rightX, top + 10, { align: 'right' });

  let y = top + 14;
  if (protocolo) {
    const label = `PROTOCOLO ${protocolo}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const tw = doc.getTextWidth(label) + 8;
    doc.setFillColor(...BADGE_BG);
    doc.roundedRect(rightX - tw, y, tw, 6, 3, 3, 'F');
    doc.setTextColor(...BLUE);
    doc.text(label, rightX - 4, y + 4, { align: 'right' });
    y += 6;
  }

  return Math.max(y, top + 16) + 8;
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number, protocolo?: string | null) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const y = ph - FOOTER_BOTTOM;

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(LEFT, y - 4, pw - MARGIN, y - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(138, 148, 161);
  doc.text('AGASEN • Instalações e Serviços em Gás', LEFT, y);
  const right = protocolo
    ? `Protocolo ${protocolo} • Página ${pageNum} de ${totalPages}`
    : `Página ${pageNum} de ${totalPages}`;
  doc.text(right, pw - MARGIN, y, { align: 'right' });
}

function drawSectionHead(doc: jsPDF, num: string, title: string, y: number): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.roundedRect(LEFT, y, 7, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...WHITE);
  doc.text(num, LEFT + 3.5, y + 4.6, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  const t = title.toUpperCase();
  doc.text(t, LEFT + 10, y + 4.8);

  const tw = doc.getTextWidth(t);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(LEFT + 13 + tw, y + 3.5, pw - MARGIN, y + 3.5);

  return y + 11;
}

function cardHeight(doc: jsPDF, value: string, w: number): number {
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(value || '—', w - 8);
  return 8 + lines.length * 4.2 + 3;
}

function drawCard(doc: jsPDF, label: string, value: string, x: number, y: number, w: number, h: number, soft = false) {
  doc.setFillColor(...(soft ? SOFT : WHITE));
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x + 4, y + 5);

  doc.setFontSize(9);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(value || '—', w - 8);
  doc.text(lines, x + 4, y + 10);
}

function drawCardRow(
  doc: jsPDF,
  items: { label: string; value: string }[],
  y: number,
  gap = 4,
): number {
  const cw = contentWidth(doc);
  const w = (cw - gap * (items.length - 1)) / items.length;
  const h = Math.max(...items.map((i) => cardHeight(doc, i.value, w)), 14);
  items.forEach((item, idx) => {
    drawCard(doc, item.label, item.value, LEFT + idx * (w + gap), y, w, h);
  });
  return y + h + gap;
}

export async function exportarRegistroAtendimento(data: RegistroAtendimentoData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const cw = contentWidth(doc);
  const protocolo = data.numero_protocolo || null;
  const logo = await getBase64FromUrl(agasenLogo);

  const dataGerado = data.data_execucao
    ? format(new Date(data.data_execucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const turnoMap: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral' };
  const unidade = [data.bloco, data.apartamento].filter(Boolean).join(' / ') || '—';
  const dataAg = data.data_agendamento
    ? format(new Date(data.data_agendamento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    : '—';
  const turno = turnoMap[data.turno ?? ''] || data.turno || '—';

  // ===== PÁGINA 1 =====
  let y = drawHeader(
    doc,
    logo,
    'RELATÓRIO DE ATENDIMENTO',
    `Documento técnico • emissão ${dataGerado}`,
    protocolo,
  );

  const ensure = (needed: number) => {
    if (y + needed > getContentBottom(doc)) {
      doc.addPage();
      y = drawHeader(doc, logo, 'RELATÓRIO DE ATENDIMENTO', 'Documento técnico • continuação', protocolo);
    }
  };

  // ---- Hero ----
  const heroH = 25;
  doc.setFillColor(247, 251, 254);
  doc.setDrawColor(220, 231, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(LEFT, y, cw, heroH, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...BLUE);
  doc.text(data.tipo_servico.toUpperCase(), LEFT + 6, y + 7);

  const heroTitleW = cw * 0.58;
  let heroFont = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(heroFont);
  while (heroFont > 9 && doc.getTextWidth(data.condominio) > heroTitleW) {
    heroFont -= 0.5;
    doc.setFontSize(heroFont);
  }
  doc.setTextColor(...NAVY);
  const condLines = doc.splitTextToSize(data.condominio, heroTitleW);
  doc.text(condLines.slice(0, 2).join(' ').substring(0, 70), LEFT + 6, y + 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('Registro formal do atendimento realizado em unidade consumidora.', LEFT + 6, y + 21);

  // meta 2x2 à direita
  const metas: [string, string][] = [
    ['Unidade', unidade],
    ['Estado', data.uf || '—'],
    ['Data', dataAg],
    ['Turno', turno],
  ];
  const metaRight = pw - MARGIN - 6;
  const metaColW = 30;
  metas.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = metaRight - (1 - col) * metaColW;
    const my = y + 10 + row * 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, my, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(String(value).substring(0, 18), x, my + 4.5, { align: 'right' });
  });

  y += heroH + 8;

  // ---- 01 Dados do atendimento ----
  ensure(45);
  y = drawSectionHead(doc, '01', 'Dados do atendimento', y);
  const fullH = Math.max(cardHeight(doc, data.condominio, cw), 14);
  drawCard(doc, 'Condomínio / Local', data.condominio, LEFT, y, cw, fullH);
  y += fullH + 4;
  y = drawCardRow(doc, [
    { label: 'Unidade (bloco / apto)', value: unidade },
    { label: 'Estado', value: data.uf || '—' },
  ], y);
  y = drawCardRow(doc, [
    { label: 'Data de agendamento', value: dataAg },
    { label: 'Turno', value: turno },
  ], y);
  y += 4;

  // ---- 02 Dados do cliente ----
  ensure(40);
  y = drawSectionHead(doc, '02', 'Dados do cliente', y);
  y = drawCardRow(doc, [
    { label: 'Cliente', value: data.morador_nome || '—' },
    { label: 'Telefone', value: formatTelefone(data.telefone) || '—' },
  ], y);
  y = drawCardRow(doc, [
    { label: 'E-mail', value: data.email || '—' },
    { label: 'CPF / CNPJ', value: formatCpfCnpj(data.cpf_cnpj) || '—' },
  ], y);
  y += 4;

  // ---- 03 Pagamento e cadastro ----
  if (data.forma_pagamento || data.valor_servico != null || data.cpf_cnpj) {
    ensure(35);
    y = drawSectionHead(doc, '03', 'Pagamento e cadastro', y);

    const gap = 4;
    const colW = (cw - gap * 2) / 3;
    const h = 18;
    drawCard(doc, 'Forma de pagamento', formatFormaPagamento(data.forma_pagamento) || '—', LEFT, y, colW, h);
    drawCard(doc, 'Documento', formatCpfCnpj(data.cpf_cnpj) || '—', LEFT + colW + gap, y, colW, h);

    const ax = LEFT + (colW + gap) * 2;
    doc.setFillColor(...NAVY);
    doc.roundedRect(ax, y, colW, h, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(188, 211, 231);
    doc.text('VALOR DO SERVIÇO', ax + 4, y + 5);
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    const valorStr = data.valor_servico != null
      ? `R$ ${Number(data.valor_servico).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';
    doc.text(valorStr, ax + 4, y + 13);

    y += h + 8;
  }

  // ---- Observação do técnico ----
  if (data.observacao_texto) {
    doc.setFontSize(8);
    const obsLines = doc.splitTextToSize(data.observacao_texto, cw - 12);
    const obsH = Math.max(obsLines.length * 4 + 8, 14);
    ensure(obsH + 16);
    y = drawSectionHead(doc, '04', 'Observação do técnico', y);
    doc.setFillColor(245, 249, 252);
    doc.rect(LEFT, y, cw, obsH, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(LEFT, y, 1.2, obsH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(obsLines, LEFT + 6, y + 6);
    y += obsH + 8;
  }

  // ---- Assinaturas ----
  const signBlockH = 46;
  ensure(signBlockH + 12);
  y = drawSectionHead(doc, data.observacao_texto ? '05' : '04', 'Assinaturas', y);

  const sigGap = 14;
  const sigW = (cw - sigGap) / 2;
  const lineY = y + 30;

  if (data.assinatura_url) {
    const imgData = await getBase64FromUrl(data.assinatura_url);
    if (imgData) {
      try {
        const props = doc.getImageProperties(imgData);
        const maxW = sigW - 10;
        const maxH = 26;
        const ratio = props.width / props.height;
        let w = maxW;
        let h = w / ratio;
        if (h > maxH) {
          h = maxH;
          w = h * ratio;
        }
        doc.addImage(imgData, 'PNG', LEFT + (sigW - w) / 2, lineY - h - 1, w, h);
      } catch {
        /* ignora assinatura inválida */
      }
    }
  }

  doc.setDrawColor(154, 166, 178);
  doc.setLineWidth(0.3);
  doc.line(LEFT, lineY, LEFT + sigW, lineY);
  doc.line(LEFT + sigW + sigGap, lineY, LEFT + cw, lineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text('Assinatura do Cliente', LEFT + sigW / 2, lineY + 5, { align: 'center' });
  doc.text('Responsável Técnico', LEFT + sigW + sigGap + sigW / 2, lineY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(data.morador_nome || '—', LEFT + sigW / 2, lineY + 9.5, { align: 'center' });
  doc.text(data.tecnico_nome || '—', LEFT + sigW + sigGap + sigW / 2, lineY + 9.5, { align: 'center' });

  y = lineY + 18;

  // ---- Nota final ----
  const fotos = data.fotos_urls || [];
  if (fotos.length > 0 && y + 18 < getContentBottom(doc)) {
    const noteText =
      'Este documento reúne os registros do atendimento conforme os dados disponíveis no sistema. Os registros fotográficos apresentados nas páginas seguintes compõem o anexo deste relatório.';
    doc.setFontSize(7.5);
    const noteLines = doc.splitTextToSize(noteText, cw - 12);
    const noteH = noteLines.length * 3.8 + 8;
    doc.setFillColor(245, 249, 252);
    doc.rect(LEFT, y, cw, noteH, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(LEFT, y, 1.2, noteH, 'F');
    doc.setTextColor(...MUTED);
    doc.text(noteLines, LEFT + 6, y + 5.5);
  }

  // ===== ANEXO FOTOGRÁFICO =====
  if (fotos.length > 0) {
    const images: { data: string; ratio: number }[] = [];
    for (const url of fotos) {
      const b64 = await getBase64FromUrl(url);
      if (!b64) continue;
      let ratio = 4 / 3;
      try {
        const props = doc.getImageProperties(b64);
        ratio = props.width / props.height;
      } catch {
        /* usa proporção padrão */
      }
      images.push({ data: b64, ratio });
    }

    const perPage = images.length <= 2 ? images.length || 1 : 4;
    const cols = images.length === 1 ? 1 : 2;

    let idx = 0;
    while (idx < images.length) {
      doc.addPage();
      let fy = drawHeader(doc, logo, 'ANEXO FOTOGRÁFICO', `Protocolo ${protocolo || '—'}`, protocolo);
      fy = drawSectionHead(doc, '06', 'Registros realizados durante o atendimento', fy);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(
        'Evidências fotográficas vinculadas ao atendimento. Cada registro mantém sua identificação individual.',
        LEFT,
        fy,
      );
      fy += 8;

      const gap = 8;
      const frameW = cols === 1 ? cw : (cw - gap) / 2;
      const available = getContentBottom(doc) - fy;
      const rows = Math.ceil(Math.min(perPage, images.length - idx) / cols);
      const frameH = Math.min((available - gap * (rows - 1)) / rows, cols === 1 ? available : available / rows);

      for (let i = 0; i < perPage && idx < images.length; i++, idx++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const fx = LEFT + col * (frameW + gap);
        const fyy = fy + row * (frameH + gap);

        doc.setDrawColor(219, 227, 235);
        doc.setLineWidth(0.25);
        doc.setFillColor(...WHITE);
        doc.roundedRect(fx, fyy, frameW, frameH, 3, 3, 'FD');

        const img = images[idx];
        const boxW = frameW - 6;
        const boxH = frameH - 12;
        let w = boxW;
        let h = w / img.ratio;
        if (h > boxH) {
          h = boxH;
          w = h * img.ratio;
        }
        try {
          doc.addImage(img.data, 'JPEG', fx + (frameW - w) / 2, fyy + 3 + (boxH - h) / 2, w, h);
        } catch {
          doc.setFontSize(8);
          doc.setTextColor(...MUTED);
          doc.text('Imagem indisponível', fx + frameW / 2, fyy + frameH / 2, { align: 'center' });
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...NAVY);
        doc.text(`Registro ${String(idx + 1).padStart(2, '0')}`, fx + 4, fyy + frameH - 3.5);
      }
    }
  }

  // ===== Rodapés =====
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pages, protocolo);
  }

  const nomeCondominio = data.condominio.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const dataFile = format(new Date(), 'yyyyMMdd_HHmmss');
  doc.save(`registro_atendimento_${dataFile}_${nomeCondominio}.pdf`);
}
