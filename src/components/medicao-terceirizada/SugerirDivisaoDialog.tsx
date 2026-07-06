import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Wand2, Users, Building2, Loader2 } from 'lucide-react'
import { sugerirDivisao, type EmpreendimentoInput, type SugestaoResultado } from '@/lib/sugerirDivisaoRota'

interface Operador {
  id: string
  nome: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: string
  empreendimentos: EmpreendimentoInput[]
  operadores: Operador[]
  onApplied: () => void
}

export default function SugerirDivisaoDialog({
  open,
  onOpenChange,
  data,
  empreendimentos,
  operadores,
  onApplied,
}: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [balancear, setBalancear] = useState(true)
  const [proximidade, setProximidade] = useState(true)
  const [sugestao, setSugestao] = useState<SugestaoResultado | null>(null)

  const totalMedidores = useMemo(
    () => empreendimentos.reduce((a, e) => a + (e.quantidade_medidores || 0), 0),
    [empreendimentos]
  )

  const semGeo = useMemo(
    () => empreendimentos.filter(e => e.latitude == null || e.longitude == null).length,
    [empreendimentos]
  )

  const toggleOperador = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSugestao(null)
  }

  const handleGerar = () => {
    const tecnicos = operadores.filter(o => selecionados.has(o.id))
    if (tecnicos.length === 0) {
      toast({ title: 'Selecione ao menos um técnico', variant: 'destructive' })
      return
    }
    if (empreendimentos.length === 0) {
      toast({ title: 'Nenhum empreendimento no dia', variant: 'destructive' })
      return
    }
    const resultado = sugerirDivisao({
      empreendimentos,
      tecnicos: tecnicos.map(t => ({ id: t.id, nome: t.nome })),
      opcoes: { balancearMedidores: balancear, agruparProximidade: proximidade },
    })
    setSugestao(resultado)
  }

  const aplicarMutation = useMutation({
    mutationFn: async () => {
      if (!sugestao) return
      const empIds = empreendimentos.map(e => e.id)

      // Remove todas as rotas_leitura do dia para esses empreendimentos
      const { error: delError } = await supabase
        .from('rotas_leitura')
        .delete()
        .eq('data', data)
        .in('empreendimento_id', empIds)
      if (delError) throw delError

      // Insere um registro por par técnico × empreendimento
      const inserts: Array<{
        data: string
        empreendimento_id: string
        operador_id: string
        status: string
      }> = []
      for (const t of sugestao.porTecnico) {
        for (const empId of t.empreendimentoIds) {
          inserts.push({
            data,
            empreendimento_id: empId,
            operador_id: t.operadorId,
            status: 'pendente',
          })
        }
      }

      if (inserts.length > 0) {
        const { error: insError } = await supabase.from('rotas_leitura').insert(inserts)
        if (insError) throw insError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura-dia'] })
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura'] })
      toast({ title: 'Divisão aplicada', description: 'A rota do dia foi atualizada.' })
      onApplied()
      setSugestao(null)
      onOpenChange(false)
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao aplicar', description: e.message, variant: 'destructive' })
    },
  })

  const handleClose = (o: boolean) => {
    if (!o) setSugestao(null)
    onOpenChange(o)
  }

  const mediaMedidores = sugestao
    ? sugestao.porTecnico.reduce((a, t) => a + t.totalMedidores, 0) / (sugestao.porTecnico.length || 1)
    : 0

  const nomeEmp = (id: string) => empreendimentos.find(e => e.id === id)?.nome || id
  const medEmp = (id: string) => empreendimentos.find(e => e.id === id)?.quantidade_medidores || 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Sugerir divisão automática
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-3 text-sm">
          <div className="p-3 bg-muted rounded-md flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <strong>{empreendimentos.length}</strong> empreendimentos
            </span>
            <span>•</span>
            <span>
              <strong>{totalMedidores}</strong> medidores
            </span>
            {semGeo > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {semGeo} sem coordenadas
                </span>
              </>
            )}
          </div>

          <div>
            <Label className="text-xs mb-2 flex items-center gap-1">
              <Users className="h-3 w-3" /> Técnicos disponíveis
            </Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-1">
                {operadores.map(op => (
                  <label
                    key={op.id}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={selecionados.has(op.id)}
                      onCheckedChange={() => toggleOperador(op.id)}
                    />
                    <span className="text-sm">{op.nome}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={balancear}
                onCheckedChange={v => {
                  setBalancear(v)
                  setSugestao(null)
                }}
              />
              <Label className="text-sm cursor-pointer">Balancear medidores</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={proximidade}
                onCheckedChange={v => {
                  setProximidade(v)
                  setSugestao(null)
                }}
              />
              <Label className="text-sm cursor-pointer">Agrupar por proximidade</Label>
            </div>
          </div>

          <Button onClick={handleGerar} className="w-full">
            <Wand2 className="mr-2 h-4 w-4" />
            Gerar sugestão
          </Button>
        </div>

        {sugestao && (
          <div className="flex-1 min-h-0 overflow-y-auto mt-2 border-t pt-3">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(sugestao.porTecnico.length, 3)}, minmax(0, 1fr))` }}>
              {sugestao.porTecnico.map(t => {
                const desvio = mediaMedidores > 0
                  ? Math.round(((t.totalMedidores - mediaMedidores) / mediaMedidores) * 100)
                  : 0
                return (
                  <div key={t.operadorId} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm truncate">{t.operadorNome}</div>
                      <Badge variant={Math.abs(desvio) <= 15 ? 'secondary' : 'outline'}>
                        {desvio > 0 ? '+' : ''}{desvio}%
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.empreendimentoIds.length} condos • {t.totalMedidores} medidores
                    </div>
                    <ul className="text-xs space-y-0.5 max-h-48 overflow-y-auto">
                      {t.empreendimentoIds.map(id => (
                        <li key={id} className="flex justify-between gap-2">
                          <span className="truncate">{nomeEmp(id)}</span>
                          <span className="text-muted-foreground shrink-0">{medEmp(id)}</span>
                        </li>
                      ))}
                      {t.empreendimentoIds.length === 0 && (
                        <li className="text-muted-foreground italic">Nenhum</li>
                      )}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0 mt-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {sugestao ? 'Descartar' : 'Fechar'}
          </Button>
          {sugestao && (
            <Button onClick={() => aplicarMutation.mutate()} disabled={aplicarMutation.isPending}>
              {aplicarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aplicar sugestão
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
