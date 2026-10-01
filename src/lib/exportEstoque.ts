import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import type { Relatorio } from '@/hooks/useRelatoriosEstoque'

const nomeArq = (t: string, ext: string) =>
  `estoque_${t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.${ext}`

export function exportarEstoquePDF(titulo: string, subtitulo: string, r: Relatorio) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(titulo, 14, 18)
  doc.setFontSize(10)
  doc.text(subtitulo, 14, 25)
  autoTable(doc, {
    startY: 30,
    head: [r.colunas],
    body: r.linhas.map((l) => l.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 120] },
  })
  if (r.rodape?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const y = ((doc as any).lastAutoTable?.finalY ?? 30) + 8
    doc.text(r.rodape.map((l) => l.join('   ')).join('  |  '), 14, y)
  }
  doc.save(nomeArq(titulo, 'pdf'))
}

export function exportarEstoqueExcel(titulo: string, r: Relatorio) {
  const ws = XLSX.utils.aoa_to_sheet([r.colunas, ...r.linhas, [], ...(r.rodape ?? [])])
  ws['!cols'] = r.colunas.map((c) => ({ wch: Math.max(12, c.length + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
  XLSX.writeFile(wb, nomeArq(titulo, 'xlsx'))
}

export function exportarEstoqueCSV(titulo: string, r: Relatorio) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [r.colunas, ...r.linhas].map((l) => l.map(esc).join(';')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nomeArq(titulo, 'csv')
  a.click()
  URL.revokeObjectURL(a.href)
}
