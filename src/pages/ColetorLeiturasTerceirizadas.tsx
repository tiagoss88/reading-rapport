import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Building2, MapPin, Gauge, Route } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ColetorLeiturasTerceirizadas() {
  const navigate = useNavigate()
  const [selectedUF, setSelectedUF] = useState<string>('')

  const { data: empreendimentos, isLoading } = useQuery({
    queryKey: ['empreendimentos-terceirizados-coletor', selectedUF],
    queryFn: async () => {
      let query = supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .order('rota')
        .order('nome')

      if (selectedUF) {
        query = query.eq('uf', selectedUF)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const ufsDisponiveis = useMemo(() => {
    if (!empreendimentos) return []
    const ufs = [...new Set(empreendimentos.map(e => e.uf))].sort()
    return ufs
  }, [empreendimentos])

  // When no UF filter, get all UFs from a separate query
  const { data: allUFs } = useQuery({
    queryKey: ['empreendimentos-ufs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('uf')
      if (error) throw error
      return [...new Set(data.map(e => e.uf))].sort()
    },
  })

  const empreendimentosPorRota = useMemo(() => {
    if (!empreendimentos) return new Map<number, typeof empreendimentos>()
    const map = new Map<number, typeof empreendimentos>()
    for (const emp of empreendimentos) {
      const rota = emp.rota
      if (!map.has(rota)) map.set(rota, [])
      map.get(rota)!.push(emp)
    }
    return map
  }, [empreendimentos])

  const rotasOrdenadas = useMemo(() => {
    return [...empreendimentosPorRota.keys()].sort((a, b) => a - b)
  }, [empreendimentosPorRota])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/coletor')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leituras</h1>
            <p className="text-sm text-gray-600">Empreendimentos por UF e Rota</p>
          </div>
        </div>

        {/* Filtro UF */}
        <Select value={selectedUF} onValueChange={setSelectedUF}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Selecione a UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as UFs</SelectItem>
            {(allUFs || []).map(uf => (
              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Lista por Rota */}
        {!isLoading && rotasOrdenadas.length === 0 && selectedUF && (
          <div className="text-center py-8 text-gray-500">
            Nenhum empreendimento encontrado para esta UF.
          </div>
        )}

        {!isLoading && !selectedUF && (
          <div className="text-center py-8 text-gray-500">
            Selecione uma UF para visualizar os empreendimentos.
          </div>
        )}

        {rotasOrdenadas.map(rota => (
          <div key={rota} className="space-y-2">
            <div className="flex items-center space-x-2 px-1">
              <Route className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-gray-700">Rota {rota}</h2>
              <span className="text-xs text-gray-400">
                ({empreendimentosPorRota.get(rota)?.length} empreendimentos)
              </span>
            </div>

            {empreendimentosPorRota.get(rota)?.map(emp => (
              <Card
                key={emp.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => navigate(`/coletor/unidades/${emp.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{emp.nome}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{emp.endereco}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Gauge className="w-3 h-3 mr-1 shrink-0" />
                        <span>{emp.quantidade_medidores} medidores</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
