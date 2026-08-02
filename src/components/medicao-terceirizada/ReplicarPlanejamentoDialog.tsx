import { useMemo, useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { format, parse, lastDayOfMonth, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Copy, AlertTriangle, Building2, Users, CalendarIcon } from 'lucide-react'


interface DiaUtil {
  id: string
  uf: string
  ano: number
  mes: number
  numero_rota: number
  data: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  uf: string
  ano: number
  mes: number
  diasUteisAtuais: DiaUtil[]
}

const toDate = (d: string) => new Date(`${d}T00:00:00`)
const fmtData = (d: string) => format(parse(d, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy", { locale: ptBR })
const nomeMes = (m: number, a: number) =>
  format(new Date(a, m - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })

// Dias úteis (seg-sex) do mês informado, em ordem
const diasUteisDoMes = (a: number, m: number) => {
  const out: string[] = []
  const ultimo = lastDayOfMonth(new Date(a, m - 1, 1)).getDate()
  for (let dia = 1; dia <= ultimo; dia++) {
    const d = new Date(a, m - 1, dia)
    const dow = getDay(d)
    if (dow !== 0 && dow !== 6) out.push(format(d, 'yyyy-MM-dd'))
  }
  return out
}

export default function ReplicarPlanejamentoDialog({ open, onOpenChange, uf, ano, mes, diasUteisAtuais }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [manterOperadores, setManterOperadores] = useState(true)
  const [substituir, setSubstituir] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Record<number, boolean>>({})
  const [destinos, setDestinos] = useState<Record<number, string>>({})

  // Competência anterior
  const anteriorMes = mes === 1 ? 12 : mes - 1
  const anteriorAno = mes === 1 ? ano - 1 : ano

  const { data: diasAnteriores, isLoading: loadingDias } = useQuery({
    queryKey: ['dias-uteis-anterior', uf, anteriorAno, anteriorMes],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dias_uteis')
        .select('*')
        .eq('uf', uf)
        .eq('ano', anteriorAno)
        .eq('mes', anteriorMes)
        .order('numero_rota', { ascending: true })
      if (error) throw error
      return data as DiaUtil[]
    }
  })

  const { data: rotasAnteriores, isLoading: loadingRotas } = useQuery({
    queryKey: ['rotas-leitura-anterior', uf, anteriorAno, anteriorMes],
    enabled: open,
    queryFn: async () => {
      const startDate = `${anteriorAno}-${String(anteriorMes).padStart(2, '0')}-01`
      const endDate = format(lastDayOfMonth(new Date(anteriorAno, anteriorMes - 1)), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('rotas_leitura')
        .select(`
          *,
          empreendimento:empreendimentos_terceirizados(id, nome, uf, quantidade_medidores),
          operador:operadores(id, nome, status)
        `)
        .gte('data', startDate)
        .lte('data', endDate)
      if (error) throw error
      return data as any[]
    }
  })

  const { data: operadoresAtivos } = useQuery({
    queryKey: ['operadores-ativos'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome, status')
        .eq('status', 'ativo')
      if (error) throw error
      return data
    }
  })

  const { data: rotasAtuais } = useQuery({
    queryKey: ['rotas-leitura', uf, String(ano), String(mes)],
    enabled: open,
    queryFn: async () => {
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`
      const endDate = format(lastDayOfMonth(new Date(ano, mes - 1)), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('rotas_leitura')
        .select('id, data, empreendimento_id')
        .gte('data', startDate)
        .lte('data', endDate)
      if (error) throw error
      return data
    }
  })

  const idsOperadoresAtivos = useMemo(
    () => new Set((operadoresAtivos || []).map((o: any) => o.id)),
    [operadoresAtivos]
  )

  const mapaDestino = useMemo(() => {
    const m = new Map<number, DiaUtil>()
    diasUteisAtuais.forEach(d => m.set(d.numero_rota, d))
    return m
  }, [diasUteisAtuais])

  const datasComPlanejamento = useMemo(
    () => new Set((rotasAtuais || []).map((r: any) => r.data)),
    [rotasAtuais]
  )

  const uteisMesAtual = useMemo(() => diasUteisDoMes(ano, mes), [ano, mes])

  // Monta as linhas: uma por rota do mês anterior que tenha planejamento
  const linhas = useMemo(() => {
    if (!diasAnteriores || !rotasAnteriores) return []
    const ordenados = [...diasAnteriores].sort((a, b) => a.data.localeCompare(b.data))
    return ordenados
      .map((dia, idx) => {
        const itens = (rotasAnteriores || []).filter(
          r => r.data === dia.data && r.empreendimento && r.empreendimento.uf === uf
        )
        const totalMedidores = itens.reduce((acc, r) => acc + (r.empreendimento?.quantidade_medidores || 0), 0)
        const operadores = Array.from(
          new Set(itens.filter(r => r.operador_id).map(r => r.operador?.nome).filter(Boolean))
        ) as string[]
        const operadoresInativos = itens.some(
          r => r.operador_id && !idsOperadoresAtivos.has(r.operador_id)
        )
        const semEmpreendimento = (rotasAnteriores || []).some(
          r => r.data === dia.data && !r.empreendimento
        )
        const destinoCadastrado = mapaDestino.get(dia.numero_rota)
        // Sem dia útil cadastrado: sugere o dia útil de mesma posição no mês atual
        const sugestao = uteisMesAtual[idx] || ''
        return {
          numero_rota: dia.numero_rota,
          dataOrigem: dia.data,
          itens,
          totalMedidores,
          operadores,
          operadoresInativos,
          semEmpreendimento,
          destinoPadrao: destinoCadastrado?.data || sugestao,
          diaUtilCadastrado: !!destinoCadastrado
        }
      })
      .filter(l => l.itens.length > 0)
  }, [diasAnteriores, rotasAnteriores, uf, idsOperadoresAtivos, mapaDestino, uteisMesAtual])

  // Inicializa seleção/destinos apenas uma vez por abertura do diálogo
  const inicializado = useRef(false)
  useEffect(() => {
    if (!open) {
      inicializado.current = false
      return
    }
    if (inicializado.current || linhas.length === 0) return
    const sel: Record<number, boolean> = {}
    const dest: Record<number, string> = {}
    linhas.forEach(l => {
      dest[l.numero_rota] = l.destinoPadrao
      sel[l.numero_rota] = !!l.destinoPadrao
    })
    setSelecionadas(sel)
    setDestinos(dest)
    inicializado.current = true
  }, [open, linhas])

  const linhasSelecionadas = linhas.filter(
    l => selecionadas[l.numero_rota] && destinos[l.numero_rota]
  )
  const resumo = {
    rotas: linhasSelecionadas.length,
    empreendimentos: linhasSelecionadas.reduce((acc, l) => acc + l.itens.length, 0),
    medidores: linhasSelecionadas.reduce((acc, l) => acc + l.totalMedidores, 0)
  }

  const replicarMutation = useMutation({
    mutationFn: async () => {
      let inseridos = 0
      let ignorados = 0
      let diasCriados = 0

      const datasCadastradas = new Set(diasUteisAtuais.map(d => d.data))
      const rotasCadastradas = new Set(diasUteisAtuais.map(d => d.numero_rota))

      for (const linha of linhasSelecionadas) {
        const dataDestino = destinos[linha.numero_rota]
        if (!dataDestino) continue

        // Cria o dia útil no mês atual quando ainda não existir
        if (!datasCadastradas.has(dataDestino)) {
          let numeroRota = linha.numero_rota
          while (rotasCadastradas.has(numeroRota)) numeroRota++
          const { error: diaError } = await supabase.from('dias_uteis').insert({
            uf, ano, mes, numero_rota: numeroRota, data: dataDestino
          })
          if (diaError) throw diaError
          datasCadastradas.add(dataDestino)
          rotasCadastradas.add(numeroRota)
          diasCriados++
        }


        const jaTemPlanejamento = datasComPlanejamento.has(dataDestino)
        if (jaTemPlanejamento && !substituir) {
          ignorados += linha.itens.length
          continue
        }

        if (jaTemPlanejamento && substituir) {
          const { error: delError } = await supabase
            .from('rotas_leitura')
            .delete()
            .eq('data', dataDestino)
          if (delError) throw delError
        }

        const registros = linha.itens
          .filter(r => r.empreendimento)
          .map(r => ({
            data: dataDestino,
            empreendimento_id: r.empreendimento_id,
            operador_id:
              manterOperadores && r.operador_id && idsOperadoresAtivos.has(r.operador_id)
                ? r.operador_id
                : null,
            status: 'pendente'
          }))

        if (registros.length > 0) {
          const { error } = await supabase.from('rotas_leitura').insert(registros)
          if (error) throw error
          inseridos += registros.length
        }
      }

      return { inseridos, ignorados, diasCriados }
    },
    onSuccess: ({ inseridos, ignorados, diasCriados }) => {
      queryClient.invalidateQueries({ queryKey: ['dias-uteis'] })
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura'] })
      queryClient.invalidateQueries({ queryKey: ['rotas-leitura-dia'] })
      toast({
        title: 'Planejamento replicado',
        description: `${inseridos} empreendimento(s) copiado(s)${diasCriados ? ` • ${diasCriados} dia(s) útil(eis) criado(s)` : ''}${ignorados ? ` • ${ignorados} ignorado(s) (dia já planejado)` : ''}`
      })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao replicar planejamento', variant: 'destructive' })
    }
  })

  const carregando = loadingDias || loadingRotas

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Replicar planejamento do mês anterior
          </DialogTitle>
          <DialogDescription>
            Origem: {nomeMes(anteriorMes, anteriorAno)} ({uf}) → Destino: {nomeMes(mes, ano)} ({uf}).
            Cada rota é encaixada no dia útil de mesmo número no mês atual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch id="manter-op" checked={manterOperadores} onCheckedChange={setManterOperadores} />
              <Label htmlFor="manter-op" className="text-sm">Manter operadores da competência anterior</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="substituir" checked={substituir} onCheckedChange={setSubstituir} />
              <Label htmlFor="substituir" className="text-sm">Substituir planejamento existente no dia de destino</Label>
            </div>
          </div>

          {carregando ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : linhas.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum planejamento encontrado em {nomeMes(anteriorMes, anteriorAno)} para {uf}.
            </div>
          ) : (
            <div className="space-y-2">
              {linhas.map(linha => {
                const destino = destinos[linha.numero_rota] || ''
                const semDiaUtil = !linha.destinoPadrao && !destino
                const jaPlanejado = destino && datasComPlanejamento.has(destino)
                return (
                  <div key={linha.numero_rota} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Checkbox
                        checked={!!selecionadas[linha.numero_rota] && !!destino}
                        disabled={!destino}
                        onCheckedChange={(v) =>
                          setSelecionadas(prev => ({ ...prev, [linha.numero_rota]: !!v }))
                        }
                      />
                      <span className="font-medium text-sm">
                        Rota {linha.numero_rota.toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmtData(linha.dataOrigem)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {linha.itens.length} empreend. • {linha.totalMedidores} medidores
                      </span>
                      {linha.operadores.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {linha.operadores.join(', ')}
                        </span>
                      )}
                      <div className="ml-auto">
                        <Select
                          value={destino}
                          onValueChange={(v) => setDestinos(prev => ({ ...prev, [linha.numero_rota]: v }))}
                        >
                          <SelectTrigger className="h-8 w-[190px] text-xs">
                            <SelectValue placeholder="Sem dia útil cadastrado" />
                          </SelectTrigger>
                          <SelectContent>
                            {diasUteisAtuais.map(d => (
                              <SelectItem key={d.id} value={d.data}>
                                Rota {d.numero_rota.toString().padStart(2, '0')} • {fmtData(d.data)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(semDiaUtil || jaPlanejado || linha.operadoresInativos || linha.semEmpreendimento) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {semDiaUtil && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Sem dia útil cadastrado
                          </Badge>
                        )}
                        {jaPlanejado && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {substituir ? 'Planejamento do dia será substituído' : 'Dia já planejado — será ignorado'}
                          </Badge>
                        )}
                        {linha.operadoresInativos && manterOperadores && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Operador inativo — ficará sem atribuição
                          </Badge>
                        )}
                        {linha.semEmpreendimento && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Empreendimento inexistente ignorado
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {linhas.length > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              Serão replicadas <strong>{resumo.rotas}</strong> rota(s), <strong>{resumo.empreendimentos}</strong> empreendimento(s) e{' '}
              <strong>{resumo.medidores}</strong> medidor(es).
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => replicarMutation.mutate()}
            disabled={resumo.rotas === 0 || replicarMutation.isPending}
          >
            {replicarMutation.isPending ? 'Replicando...' : 'Replicar planejamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
