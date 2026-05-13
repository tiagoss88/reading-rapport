import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, Clock, Pencil, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface ServicoNacionalGas {
  id: string
  data_solicitacao: string | null
  condominio_nome_original: string
  bloco: string | null
  apartamento: string | null
  tipo_servico: string
  status_atendimento: string
  morador_nome: string | null
  uf: string
}

interface PainelUrgenciasProps {
  servicos: ServicoNacionalGas[]
  onEditServico?: (servico: ServicoNacionalGas) => void
}

type NivelUrgencia = 'vencido' | 'critico' | 'atencao'

interface ServicoUrgente {
  servico: ServicoNacionalGas
  diasRestantes: number
  nivel: NivelUrgencia
  prazoDias: number
  semData: boolean
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getPrazoDias(tipoServico: string): number | null {
  const normalizado = normalizarTexto(tipoServico)
  if (normalizado.includes('religacao emergencial') || normalizado.includes('religacao de emergencia')) {
    return 1
  }
  if (normalizado.includes('religacao') || normalizado.includes('religamento')) {
    return 2
  }
  if (normalizado.includes('desligamento') || normalizado.includes('desligacao')) {
    return 2
  }
  return null
}

// Domingo (0) não é dia útil; sábado (6) é.
function isDiaUtil(d: Date): boolean {
  return d.getDay() !== 0
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDiasUteis(date: Date, n: number): Date {
  const result = startOfDay(date)
  let added = 0
  while (added < n) {
    result.setDate(result.getDate() + 1)
    if (isDiaUtil(result)) added++
  }
  return result
}

// Conta dias úteis entre `from` (exclusivo) e `to` (inclusivo). Negativo se to < from.
function contarDiasUteisEntre(from: Date, to: Date): number {
  const a = startOfDay(from)
  const b = startOfDay(to)
  if (a.getTime() === b.getTime()) return 0
  const sign = b > a ? 1 : -1
  let count = 0
  const cursor = new Date(a)
  while (cursor.getTime() !== b.getTime()) {
    cursor.setDate(cursor.getDate() + sign)
    if (isDiaUtil(cursor)) count += sign
  }
  return count
}

function calcularDiasUteisRestantes(dataSolicitacao: Date, prazoDias: number): number {
  const dataLimite = addDiasUteis(dataSolicitacao, prazoDias)
  return contarDiasUteisEntre(new Date(), dataLimite)
}

function getNivel(diasRestantes: number, _prazoDias: number): NivelUrgencia {
  if (diasRestantes <= 0) return 'vencido'
  if (diasRestantes <= 1) return 'critico'
  return 'atencao'
}

const nivelConfig = {
  vencido: {
    label: 'Vencido',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200',
    borderClass: 'border-l-red-500',
  },
  critico: {
    label: 'Crítico',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200',
    borderClass: 'border-l-orange-500',
  },
  atencao: {
    label: 'Atenção',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200',
    borderClass: 'border-l-yellow-500',
  },
}

function formatarTempoRestante(dias: number, semData: boolean): string {
  if (semData) return 'Data não informada'
  if (dias < 0) {
    const abs = Math.abs(dias)
    return `Vencido há ${abs} dia${abs > 1 ? 's' : ''} útil${abs > 1 ? 'eis' : ''}`
  }
  if (dias === 0) return 'Vence hoje'
  if (dias === 1) return 'Vence amanhã'
  return `Faltam ${dias} dias úteis`
}

export function getServicosUrgentes(servicos: ServicoNacionalGas[]): ServicoUrgente[] {
  const urgentes: ServicoUrgente[] = []

  for (const servico of servicos) {
    if (servico.status_atendimento !== 'pendente' && servico.status_atendimento !== 'agendado') continue

    const prazoDias = getPrazoDias(servico.tipo_servico)
    if (prazoDias === null) continue

    if (!servico.data_solicitacao) {
      urgentes.push({
        servico,
        diasRestantes: -999,
        nivel: 'vencido',
        prazoDias,
        semData: true,
      })
      continue
    }

    const dataSolic = new Date(`${servico.data_solicitacao}T00:00:00`)
    const diasRestantes = calcularDiasUteisRestantes(dataSolic, prazoDias)
    const nivel = getNivel(diasRestantes, prazoDias)

    urgentes.push({ servico, diasRestantes, nivel, prazoDias, semData: false })
  }

  urgentes.sort((a, b) => a.diasRestantes - b.diasRestantes)
  return urgentes
}

export default function PainelUrgencias({ servicos, onEditServico }: PainelUrgenciasProps) {
  const urgentes = useMemo(() => getServicosUrgentes(servicos), [servicos])
  const [resumoOpen, setResumoOpen] = useState(false)
  const [ufFiltro, setUfFiltro] = useState<string>('TODAS')
  const { toast } = useToast()

  const ufsDisponiveis = useMemo(
    () => Array.from(new Set(urgentes.map(u => u.servico.uf).filter(Boolean))).sort(),
    [urgentes]
  )

  if (urgentes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm font-medium">Nenhum serviço com prazo crítico no momento</p>
          <p className="text-xs mt-1">Serviços de Religação e Desligamento com prazos apertados aparecerão aqui.</p>
        </CardContent>
      </Card>
    )
  }

  const urgentesFiltrados = ufFiltro === 'TODAS'
    ? urgentes
    : urgentes.filter(u => u.servico.uf === ufFiltro)

  const vencidos = urgentesFiltrados.filter(u => u.nivel === 'vencido')
  const criticos = urgentesFiltrados.filter(u => u.nivel === 'critico')
  const atencao = urgentesFiltrados.filter(u => u.nivel === 'atencao')

  const contagemPorUf = (uf: string) => urgentes.filter(u => u.servico.uf === uf).length

  const formatLinhaResumo = (item: ServicoUrgente) => {
    const s = item.servico
    const localizacao = [s.bloco && `Bloco ${s.bloco}`, s.apartamento && `Apto ${s.apartamento}`]
      .filter(Boolean)
      .join(' ')
    const partes = [
      `[${s.uf}]`,
      s.condominio_nome_original,
      localizacao || null,
      s.tipo_servico,
      formatarTempoRestante(item.diasRestantes, item.semData),
    ].filter(Boolean)
    return `• ${partes.join(' — ')}`
  }

  const textoResumo = (() => {
    const escopo = ufFiltro === 'TODAS' ? '' : ` — UF: ${ufFiltro}`
    const linhas: string[] = [
      `🚨 Serviços com Prazo Crítico${escopo} — ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      '',
    ]
    if (vencidos.length > 0) {
      linhas.push(`🔴 VENCIDOS (${vencidos.length}):`, ...vencidos.map(formatLinhaResumo), '')
    }
    if (criticos.length > 0) {
      linhas.push(`🟠 CRÍTICOS (${criticos.length}):`, ...criticos.map(formatLinhaResumo), '')
    }
    if (atencao.length > 0) {
      linhas.push(`🟡 ATENÇÃO (${atencao.length}):`, ...atencao.map(formatLinhaResumo), '')
    }
    return linhas.join('\n').trimEnd()
  })()

  const handleCopiar = async () => {
    await navigator.clipboard.writeText(textoResumo)
    toast({ title: 'Copiado!', description: 'Resumo enviado para a área de transferência.' })
  }

  return (
    <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base flex-wrap">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span>Serviços com Prazo Crítico</span>
          <div className="flex gap-1.5 ml-auto items-center">
            <Button variant="outline" size="sm" onClick={() => setResumoOpen(true)}>
              <Copy className="h-4 w-4 mr-1" /> Copiar Resumo
            </Button>
            {vencidos.length > 0 && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                {vencidos.length} vencido{vencidos.length > 1 ? 's' : ''}
              </Badge>
            )}
            {criticos.length > 0 && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                {criticos.length} crítico{criticos.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {ufsDisponiveis.length > 1 && (
        <div className="px-6 pb-2 flex flex-wrap gap-1.5">
          <Button
            variant={ufFiltro === 'TODAS' ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setUfFiltro('TODAS')}
          >
            Todas ({urgentes.length})
          </Button>
          {ufsDisponiveis.map(uf => (
            <Button
              key={uf}
              variant={ufFiltro === uf ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setUfFiltro(uf)}
            >
              {uf} ({contagemPorUf(uf)})
            </Button>
          ))}
        </div>
      )}
      <CardContent className="space-y-2 pt-0">
        {urgentesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum serviço urgente para a UF selecionada</p>
          </div>
        ) : urgentesFiltrados.map((item) => {
          const config = nivelConfig[item.nivel]
          return (
            <div
              key={item.servico.id}
              className={`flex items-center gap-3 p-3 rounded-md border border-l-4 bg-background ${config.borderClass}`}
            >
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold">
                    {item.servico.uf}
                  </Badge>
                  <span className="font-medium text-sm truncate">
                    {item.servico.condominio_nome_original}
                  </span>
                  {item.servico.apartamento && (
                    <span className="text-xs text-muted-foreground">
                      Apto {item.servico.apartamento}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{item.servico.tipo_servico}</span>
                  <span className="text-xs font-medium">
                    {formatarTempoRestante(item.diasRestantes, item.semData)}
                  </span>
                </div>
              </div>
              <Badge className={config.badgeClass}>{config.label}</Badge>
              {onEditServico && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onEditServico(item.servico as any)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>

      <Dialog open={resumoOpen} onOpenChange={setResumoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resumo — Serviços com Prazo Crítico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              readOnly
              value={textoResumo}
              className="w-full h-80 p-3 text-sm bg-muted rounded-md border resize-none font-mono"
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="flex justify-end">
              <Button onClick={handleCopiar}>
                <Copy className="h-4 w-4 mr-1" /> Copiar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
