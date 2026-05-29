import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import logoUrl from '@/assets/agasen-logo.png';

export interface ComprovantePagamentoData {
  numero_protocolo?: string | null;
  data_hora?: string | null;
  cliente?: string | null;
  cpf_cnpj?: string | null;
  condominio?: string | null;
  bloco?: string | null;
  apartamento?: string | null;
  tipo_servico?: string | null;
  forma_pagamento?: string | null;
  valor_servico?: number | null;
}

const FONTS_LINK_ID = 'agasen-receipt-fonts';

function ensureFonts() {
  if (document.getElementById(FONTS_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = FONTS_LINK_ID;
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap';
  document.head.appendChild(link);
}

function fmtMoney(v?: number | null) {
  if (v == null || isNaN(Number(v))) return 'R$ 0,00';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dash(v?: string | null) {
  const s = (v ?? '').toString().trim();
  return s.length ? s : '—';
}

function row(label: string, value: string) {
  return `<div style="display:flex;justify-content:space-between;margin-bottom:8px;border-bottom:1px dotted #eee;padding-bottom:4px;gap:8px;">
    <span style="color:#888;text-transform:uppercase;font-size:10px;font-weight:600;">${label}</span>
    <span style="font-weight:700;color:#1a1a1a;text-align:right;">${value}</span>
  </div>`;
}

function buildHTML(d: ComprovantePagamentoData, qrDataUrl: string) {
  const unidade =
    [d.bloco && `${d.bloco}`, d.apartamento && `${d.apartamento}`].filter(Boolean).join(' / ') || '—';

  return `
    <div class="agasen-receipt" style="
      width:350px;background:#fff;position:relative;padding:30px 20px;color:#1a1a1a;
      font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;box-sizing:border-box;
      -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:geometricPrecision;">
      <div style="position:absolute;left:0;right:0;top:-10px;height:10px;
        background-image:radial-gradient(circle at 10px -10px, transparent 12px, #fff 13px);
        background-size:20px 20px;background-repeat:repeat-x;"></div>
      <div style="position:absolute;left:0;right:0;bottom:-10px;height:10px;
        background-image:radial-gradient(circle at 10px 30px, transparent 12px, #fff 13px);
        background-size:20px 20px;background-repeat:repeat-x;"></div>

      <div style="text-align:center;margin-bottom:25px;">
        <img src="${logoUrl}" alt="Agasen" style="max-width:180px;margin-bottom:10px;display:inline-block;" />
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:700;line-height:1.5;">
          AGASEN INSTALAÇÕES E SERVIÇOS LTDA<br/>
          CNPJ: 44.620.393/0001-01<br/>
          www.agasen.com.br
        </div>
      </div>

      <div style="border-top:1px dashed #26a9b5;border-bottom:1px dashed #26a9b5;padding:10px 0;margin:20px 0;text-align:center;">
        <h2 style="margin:0;font-size:14px;letter-spacing:2px;color:#003366;font-weight:800;">COMPROVANTE DE PAGAMENTO</h2>
      </div>

      <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;margin-bottom:20px;">
        ${row('Protocolo', dash(d.numero_protocolo))}
        ${row('Data / Hora', dash(d.data_hora))}
        ${row('Cliente', dash(d.cliente).toUpperCase())}
        ${row('CPF / CNPJ', dash(d.cpf_cnpj))}
        ${row('Condomínio', dash(d.condominio).toUpperCase())}
        ${row('Unidade', unidade.toUpperCase())}
        ${row('Serviço', dash(d.tipo_servico).toUpperCase())}
        ${row('Pagamento', dash(d.forma_pagamento).toUpperCase())}
      </div>

      <div style="background:#e9f6f7;border:1px solid #26a9b5;padding:15px;display:flex;justify-content:space-between;align-items:center;margin-top:20px;border-radius:4px;">
        <span style="font-weight:700;font-size:12px;color:#003366;">VALOR TOTAL</span>
        <span style="font-size:20px;font-weight:800;color:#003366;">${fmtMoney(d.valor_servico)}</span>
      </div>

      <div style="margin-top:30px;display:flex;flex-direction:column;align-items:center;gap:10px;padding-top:20px;border-top:1px dashed #26a9b5;">
        <div style="width:110px;height:110px;background:#fff;display:flex;align-items:center;justify-content:center;border:1px solid #26a9b5;padding:5px;box-sizing:border-box;">
          <img src="${qrDataUrl}" alt="QR" style="width:100%;height:100%;display:block;image-rendering:pixelated;" />
        </div>
        <div style="font-size:10px;color:#666;text-align:center;line-height:1.4;">
          <strong style="color:#003366;display:block;margin-bottom:2px;">VISITE NOSSO SITE</strong>
          Acesse www.agasen.com.br para conhecer mais sobre nossos serviços.
        </div>
      </div>

      <div style="text-align:center;font-size:10px;color:#aaa;margin-top:30px;line-height:1.5;">
        Obrigado pela confiança!<br/>
        Gerado via Sistema
      </div>
    </div>
  `;
}

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          })
    )
  );
}

export async function exportarComprovantePagamento(data: ComprovantePagamentoData) {
  ensureFonts();

  // QR local (sem rede, sem CORS, sem pixelização)
  const qrDataUrl = await QRCode.toDataURL('https://www.agasen.com.br', {
    margin: 1,
    width: 512,
    errorCorrectionLevel: 'M',
    color: { dark: '#003366', light: '#FFFFFF' },
  });

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.background = '#fff';
  host.style.padding = '20px';
  host.innerHTML = buildHTML(data, qrDataUrl);
  document.body.appendChild(host);

  try {
    if ((document as any).fonts?.ready) {
      try { await (document as any).fonts.ready; } catch {}
    }
    await waitForImages(host);
    await new Promise((r) => setTimeout(r, 150));

    const target = host.firstElementChild as HTMLElement;

    // scale=3 → ~300 DPI quando renderizado em 80mm
    const canvas = await html2canvas(target, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      imageTimeout: 0,
    });

    // JPEG com qualidade alta — preserva fidelidade e reduz peso drasticamente vs PNG
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    const widthMM = 80;
    const heightMM = (canvas.height / canvas.width) * widthMM;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [widthMM, heightMM],
      compress: true,
    });

    // 'FAST' habilita compressão de stream interna do jsPDF mantendo a imagem JPEG já comprimida
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMM, heightMM, undefined, 'FAST');

    // Metadados mínimos
    pdf.setProperties({
      title: `Comprovante ${data.numero_protocolo ?? ''}`.trim(),
      creator: 'Agasen',
      author: 'Agasen',
    });

    const filename = `comprovante-${(data.numero_protocolo ?? 'agasen').replace(/[^\w-]/g, '')}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}
