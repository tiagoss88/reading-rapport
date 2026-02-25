import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Building2, Users, Gauge, ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { format, parse, lastDayOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const meses = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
]

const currentYear = new Date().getFullYear()
const anos = Array.from({ length: 5 }, (_, i) => currentYear + i)

export default function ColetorCronograma() {
  const navigate = useNavigate()
  const [uf, setUf] = useState<string>('BA')
  const [ano, setAno] = useState<string>(currentYear.toString())
  const [mes, setMes] = useState<string>((new Date().getMonth() + 1).toString())
  const [expandedDiaId, setExpandedDiaId] = useState<string | null>(null)

  const { data: diasUteis, isLoading } = useQuery({
    queryKey: ['dias-uteis', uf, ano, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dias_uteis')
        .select('*')
        .eq('uf', uf)
        .eq('ano', parseInt(ano))
        .eq('mes', parseInt(mes))
        .order('numero_rota', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const { data: empreendimentos } = useQuery({
    queryKey: ['empreendimentos-terceirizados-por-rota', uf],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .eq('uf', uf)
        .order('rota', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const { data: rotasLeitura } = useQuery({
    queryKey: ['rotas-leitura', uf, ano, mes],
    queryFn: async () => {
      const startDate = `${ano}-${mes.padStart(2, '0')}-01`
      const endDate = format(lastDayOfMonth(new Date(parseInt(ano), parseInt(mes) - 1)), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('rotas_leitura')
        .select(`*, operador:operadores(nome)`)
        .gte('data', startDate)
        .lte('data', endDate)
      if (error) throw error
      return data
    }
  })

  const getEmpreendimentosPorRota = (rota: number) => {
    return empreendimentos?.filter(e => e.rota === rota) || []
  }

  const getRotasLeituraParaData = (data: string) => {
    return rotasLeitura?.filter(r => r.data === data) || []
  }

  const getOperadoresDoEmpreendimento = (empreendimentoId: string, data: string) => {
    const rotas = rotasLeitura?.filter(r => r.empreendimento_id === empreendimentoId && r.data === data) || []
    const nomes = [...new Set(rotas.map(r => (r as any).operador?.nome).filter(Boolean))]
    return nomes
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/coletor')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Cronograma de Leitura</h1>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-2">
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : diasUteis?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum dia útil cadastrado para este período
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {diasUteis?.map((dia) => {
              const emps = getEmpreendimentosPorRota(dia.numero_rota)
              const rotasDoDia = getRotasLeituraParaData(dia.data)
              const totalMedidores = emps.reduce((acc, e) => acc + e.quantidade_medidores, 0)

              const isExpanded = expandedDiaId === dia.id

              return (
                <Collapsible
                  key={dia.id}
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedDiaId(open ? dia.id : null)}
                >
                  <Card className="cursor-pointer">
                    <CollapsibleTrigger asChild>
                      <div>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              Rota {dia.numero_rota.toString().padStart(2, '0')}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {rotasDoDia.length > 0 ? (() => {
                                const distinctOperadores = new Set(rotasDoDia.filter(r => r.operador_id).map(r => r.operador_id))
                                return (
                                  <Badge variant="secondary" className="text-xs">
                                    <Users className="mr-1 h-3 w-3" />
                                    {distinctOperadores.size} operador(es)
                                  </Badge>
                                )
                              })() : (
                                <Badge variant="outline" className="text-xs">Não planejado</Badge>
                              )}
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {format(parse(dia.data, 'yyyy-MM-dd', new Date()), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {emps.length} empreendimento(s)
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3.5 w-3.5" />
                              {totalMedidores} medidores
                            </span>
                          </div>
                        </CardContent>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-border">
                        <div className="divide-y divide-border">
                          {emps.map((emp) => {
                            const operadores = getOperadoresDoEmpreendimento(emp.id, dia.data)
                            return (
                              <div key={emp.id} className="py-3 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm font-medium">{emp.nome}</span>
                                </div>
                                {emp.endereco && (
                                  <p className="text-xs text-muted-foreground ml-6">{emp.endereco}</p>
                                )}
                                <p className="text-xs text-muted-foreground ml-6">
                                  <Gauge className="inline h-3 w-3 mr-1" />
                                  {emp.quantidade_medidores} medidores
                                </p>
                                <p className="text-xs ml-6">
                                  {operadores.length > 0 ? (
                                    <span className="text-foreground">→ {operadores.join(', ')}</span>
                                  ) : (
                                    <span className="text-muted-foreground italic">→ Sem operador atribuído</span>
                                  )}
                                </p>
                              </div>
                            )
                          })}
                          {emps.length === 0 && (
                            <p className="py-3 text-xs text-muted-foreground italic">Nenhum empreendimento nesta rota</p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
