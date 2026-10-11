import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { usePermissions } from '@/contexts/PermissionsContext'
import { isTabelaAusente } from '@/hooks/useEstoque'
import { sbFin, fmtBRL, tipoNaoCobrado } from '@/hooks/useFinanceiro'

/** Situação financeira da OS (somente leitura, só admin). */
export default function FinanceiroDaOsCard({ servicoId, valor, tipo }: { servicoId: string; valor: number | null | undefined; tipo?: string | null }) {
  const { isAdmin } = usePermissions()
  const ignorado = tipoNaoCobrado(tipo)
  const { data } = useQuery({
    queryKey: ['financeiro', 'os', servicoId],
    enabled: isAdmin && !!servicoId && !ignorado,
    queryFn: async () => {
      const [r, s] = await Promise.all([
        sbFin.from('financeiro_recebimentos').select('valor, estornado_em').eq('servico_id', servicoId),
        sbFin.from('financeiro_situacao_os').select('isento').eq('servico_id', servicoId).maybeSingle(),
      ])
      if (isTabelaAusente(r.error)) return null
      if (r.error) throw r.error
      const recebido = (r.data ?? []).filter((x: any) => !x.estornado_em).reduce((a: number, x: any) => a + Number(x.valor), 0)
      return { recebido, isento: !!s.data?.isento }
    },
  })
  if (!isAdmin || ignorado || !data) return null
  const v = Number(valor) || 0
  const sit = data.isento ? 'Isento' : data.recebido <= 0 ? 'Pendente' : data.recebido + 0.009 < v ? 'Parcial' : 'Pago'
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1 text-xs"><Wallet className="h-3 w-3" /> Financeiro</Label>
      <div className="rounded-md border p-2 text-xs">
        Situação: <b>{sit}</b> · Recebido: <b>{fmtBRL(data.recebido)}</b>{!data.isento && <> · Saldo: <b>{fmtBRL(Math.max(0, v - data.recebido))}</b></>}
      </div>
    </div>
  )
}
