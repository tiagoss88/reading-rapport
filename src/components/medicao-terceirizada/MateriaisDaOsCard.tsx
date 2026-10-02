import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { usePermissions } from '@/contexts/PermissionsContext'
import { sbEstoque, isTabelaAusente, fmtQtd } from '@/hooks/useEstoque'

interface Linha { id: string; material: string; unidade: string; quantidade: number; armazem: string; data: string }
interface Resultado { linhas: Linha[]; semMaterial: boolean }

/** Materiais que saíram do estoque para a OS (somente leitura, só admin). */
export default function MateriaisDaOsCard({ servicoId }: { servicoId: string }) {
  const { isAdmin } = usePermissions()

  const { data } = useQuery({
    queryKey: ['os-materiais', servicoId],
    enabled: isAdmin && !!servicoId,
    staleTime: 10_000,
    queryFn: async (): Promise<Resultado | null> => {
      const { data: movs, error } = await sbEstoque
        .from('estoque_movimentacoes')
        .select('id, material_id, armazem_id, quantidade, created_at')
        .eq('servico_id', servicoId)
        .eq('tipo', 'saida')
        .order('created_at', { ascending: true })
      if (error) {
        if (isTabelaAusente(error)) return null
        throw error
      }
      const lista = (movs ?? []) as { id: string; material_id: string; armazem_id: string | null; quantidade: number; created_at: string }[]
      let semMaterial = false
      if (lista.length === 0) {
        const { data: sem, error: e2 } = await sbEstoque
          .from('estoque_os_sem_material').select('servico_id').eq('servico_id', servicoId).maybeSingle()
        semMaterial = !e2 && !!sem
      }
      const [{ data: mats }, { data: arms }] = await Promise.all([
        sbEstoque.from('materiais').select('id, nome, unidade'),
        sbEstoque.from('armazens').select('id, nome'),
      ])
      const mm = new Map<string, { nome: string; unidade: string }>((mats ?? []).map((m: { id: string; nome: string; unidade: string }) => [m.id, m]))
      const aa = new Map<string, string>((arms ?? []).map((a: { id: string; nome: string }) => [a.id, a.nome]))
      return {
        semMaterial,
        linhas: lista.map((l) => ({
          id: l.id,
          material: mm.get(l.material_id)?.nome ?? '—',
          unidade: mm.get(l.material_id)?.unidade ?? '',
          quantidade: Number(l.quantidade),
          armazem: l.armazem_id ? aa.get(l.armazem_id) ?? '—' : '—',
          data: l.created_at,
        })),
      }
    },
  })

  if (!isAdmin || !data) return null

  return (
    <div className="rounded-md border p-3 space-y-2">
      <Label className="flex items-center gap-1.5"><Package className="w-4 h-4" /> Materiais utilizados</Label>
      {data.linhas.length > 0 ? (
        <ul className="divide-y text-sm">
          {data.linhas.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-1.5">
              <span className="flex-1 min-w-0 truncate">{l.material}</span>
              <span className="font-medium whitespace-nowrap">{fmtQtd(l.quantidade)} {l.unidade}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                {l.armazem} · {format(new Date(l.data), 'dd/MM/yyyy HH:mm')}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          {data.semMaterial ? 'Nenhum material utilizado (informado pelo técnico).' : 'Nenhum material registrado para esta OS.'}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">Para corrigir, use Operação › Estoque › Baixa por serviço.</p>
    </div>
  )
}
