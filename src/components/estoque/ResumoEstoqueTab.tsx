import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface Props {
  refreshKey?: number
}

interface Resumo {
  ativos: number
  criticos: { nome: string; saldo: number; minimo: number; unidade: string }[]
  entradasMes: number
  saidasMes: number
  maisConsumidos: { nome: string; total: number }[]
}

const VAZIO: Resumo = { ativos: 0, criticos: [], entradasMes: 0, saidasMes: 0, maisConsumidos: [] }

export default function ResumoEstoqueTab({ refreshKey = 0 }: Props) {
  const [resumo, setResumo] = useState<Resumo>(VAZIO)
  const [loading, setLoading] = useState(true)

  const fetchResumo = useCallback(async () => {
    setLoading(true)
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const [saldoRes, movRes] = await Promise.all([
      supabase.from('materiais_saldo').select('*'),
      supabase
        .from('estoque_movimentacoes')
        .select('tipo, quantidade, created_at, materiais(nome)')
        .gte('created_at', inicioMes.toISOString()),
    ])

    const saldos = (saldoRes.data || []) as any[]
    const movs = (movRes.data || []) as any[]

    const ativos = saldos.filter(s => s.ativo).length
    const criticos = saldos
      .filter(s => s.ativo && Number(s.saldo) <= Number(s.estoque_minimo))
      .map(s => ({ nome: s.nome, saldo: Number(s.saldo), minimo: Number(s.estoque_minimo), unidade: s.unidade }))
      .sort((a, b) => a.saldo - b.saldo)

    let entradasMes = 0
    let saidasMes = 0
    const consumo = new Map<string, number>()
    movs.forEach(m => {
      const q = Number(m.quantidade) || 0
      if (m.tipo === 'entrada') entradasMes += q
      if (m.tipo === 'saida') {
        saidasMes += q
        const nome = m.materiais?.nome || '—'
        consumo.set(nome, (consumo.get(nome) || 0) + q)
      }
    })

    const maisConsumidos = Array.from(consumo.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    setResumo({ ativos, criticos, entradasMes, saidasMes, maisConsumidos })
    setLoading(false)
  }, [])

  useEffect(() => { fetchResumo() }, [fetchResumo, refreshKey])

  const cards = [
    { label: 'Materiais ativos', value: resumo.ativos, icon: Package, color: 'text-primary' },
    { label: 'Abaixo do mínimo', value: resumo.criticos.length, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Entradas no mês', value: resumo.entradasMes, icon: ArrowDownCircle, color: 'text-emerald-600' },
    { label: 'Saídas no mês', value: resumo.saidasMes, icon: ArrowUpCircle, color: 'text-orange-600' },
  ]

  if (loading) return <p className="text-xs text-muted-foreground">Carregando resumo...</p>

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-semibold">{c.value}</p>
              </div>
              <c.icon className={`h-8 w-8 ${c.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold">Materiais em nível crítico</h3>
            {resumo.criticos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum material abaixo do mínimo.</p>}
            {resumo.criticos.map(c => (
              <div key={c.nome} className="flex items-center justify-between text-xs border-b last:border-0 py-1.5">
                <span>{c.nome}</span>
                <Badge variant="destructive">{c.saldo} / mín. {c.minimo} {c.unidade}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold">Mais consumidos no mês</h3>
            {resumo.maisConsumidos.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma saída registrada neste mês.</p>}
            {resumo.maisConsumidos.map(c => (
              <div key={c.nome} className="flex items-center justify-between text-xs border-b last:border-0 py-1.5">
                <span>{c.nome}</span>
                <span className="font-semibold">{c.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
