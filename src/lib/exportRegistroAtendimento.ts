import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

function getTurnoLabel(turno: string | null): string {
  if (!turno) return '-';
  const map: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral' };
  return map[turno] || turno;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pendente: 'Pendente',
    agendado: 'Agendado',
    executado: 'Executado',
    cancelado: 'Cancelado',
    reagendado: 'Reagendado',
  };
  return map[status] || status;
}

export async function exportarRegistroAtendimento(data: RegistroAtendimentoData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRO DE ATENDIMENTO', pageWidth / 2, y, { align: 'center' });
  if (data.numero_protocolo) {
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Protocolo: ${data.numero_protocolo}`, pageWidth / 2, y, { align: 'center' });
  }
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Consumer data
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CONSUMIDOR', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    body: [
      ['Consumidor', data.morador_nome || '-'],
      ['Ponto de Consumo', data.condominio],
      ['Endereço', data.endereco || '-'],
      ['Bloco / Apt', `${data.bloco || '-'} / ${data.apartamento || '-'}`],
      ['UF', data.uf || '-'],
      ['Telefone', data.telefone || '-'],
      ['E-mail', data.email || '-'],
    ],
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Service data
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO SERVIÇO', 14, y);
  y += 2;

  const dataAgendamento = data.data_agendamento
    ? format(new Date(data.data_agendamento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    : '-';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    body: [
      ['Tipo de Serviço', data.tipo_servico.toUpperCase()],
      ['Data Agendamento', dataAgendamento],
      ['Turno', getTurnoLabel(data.turno ?? null)],
      ['Técnico', data.tecnico_nome || '-'],
      ['Status', getStatusLabel(data.status_atendimento)],
    ],
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Observations
  if (data.observacao_texto) {
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      body: [[data.observacao_texto]],
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Payment
  if (data.forma_pagamento || data.valor_servico != null || data.cpf_cnpj) {
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS FINANCEIROS', 14, y);
    y += 2;

    const finRows: string[][] = [];
    if (data.forma_pagamento) finRows.push(['Forma de Pagamento', data.forma_pagamento]);
    if (data.valor_servico != null) finRows.push(['Valor do Serviço', `R$ ${Number(data.valor_servico).toFixed(2).replace('.', ',')}`]);
    if (data.cpf_cnpj) finRows.push(['CPF/CNPJ', data.cpf_cnpj]);

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
      body: finRows,
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Photo links
  if (data.fotos_urls && data.fotos_urls.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO FOTOGRÁFICO', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    data.fotos_urls.forEach((url, i) => {
      doc.textWithLink(`Foto ${i + 1}: ${url}`, 14, y, { url });
      y += 5;
    });
    y += 4;
  }

  // Signature
  if (data.assinatura_url) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURA DO CLIENTE', 14, y);
    y += 4;

    const imgData = await getBase64FromUrl(data.assinatura_url);
    if (imgData) {
      doc.addImage(imgData, 'PNG', 14, y, 80, 30);
      y += 34;
    }
    doc.setLineWidth(0.3);
    doc.line(14, y, 94, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do cliente', 54, y, { align: 'center' });
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      14,
      footerY
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, footerY, { align: 'right' });
  }

  const nomeCondominio = data.condominio.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const dataFile = format(new Date(), 'yyyyMMdd_HHmmss');
  doc.save(`registro_atendimento_${dataFile}_${nomeCondominio}.pdf`);
}
