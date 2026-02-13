import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Building2, MapPin, Gauge, Route, Search, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ColetorLeiturasTerceirizadas() {
  const navigate = useNavigate()
  const [selectedUF, setSelectedUF] = useState<string>('')
  const [selectedRota, setSelectedRota] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const isSearchActive = searchTerm.length >= 3

  // Search by name query
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['empreendimentos-busca', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .ilike('nome', `%${searchTerm}%`)
        .order('nome')
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: isSearchActive,
  })

  // Fetch all available UFs
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

  // Fetch available rotas for the selected UF
  const { data: rotasDisponiveis } = useQuery({
    queryKey: ['empreendimentos-rotas', selectedUF],
    queryFn: async () => {
      let query = supabase
        .from('empreendimentos_terceirizados')
        .select('rota')
      if (selectedUF && selectedUF !== 'all') {
        query = query.eq('uf', selectedUF)
      }
      const { data, error } = await query
      if (error) throw error
      return [...new Set(data.map(e => e.rota))].sort((a, b) => a - b)
    },
    enabled: !!selectedUF,
  })

  // Fetch empreendimentos only when both UF and Rota are selected
  const { data: empreendimentos, isLoading } = useQuery({
    queryKey: ['empreendimentos-terceirizados-coletor', selectedUF, selectedRota],
    queryFn: async () => {
      let query = supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .order('nome')

      if (selectedUF && selectedUF !== 'all') {
        query = query.eq('uf', selectedUF)
      }
      if (selectedRota && selectedRota !== 'all') {
        query = query.eq('rota', Number(selectedRota))
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!selectedUF && !!selectedRota,
  })

  const handleUFChange = (value: string) => {
    setSelectedUF(value)
    setSelectedRota('')
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  // Determine which list to show
  const displayList = isSearchActive ? searchResults : empreendimentos
  const displayLoading = isSearchActive ? isSearchLoading : (isLoading && !!selectedRota)

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

        {/* Busca por nome */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome do prédio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 bg-white"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSearchActive && (
          <p className="text-xs text-gray-500 px-1">
            Buscando por "{searchTerm}" — {searchResults?.length ?? 0} resultado(s)
          </p>
        )}

        {/* Filtros UF/Rota - escondidos durante busca */}
        {!isSearchActive && (
          <>
            <Select value={selectedUF} onValueChange={handleUFChange}>
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

            {selectedUF && (
              <Select value={selectedRota} onValueChange={setSelectedRota}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione a Rota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Rotas</SelectItem>
                  {(rotasDisponiveis || []).map(rota => (
                    <SelectItem key={rota} value={String(rota)}>Rota {rota}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}

        {/* Loading */}
        {displayLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Messages */}
        {!isSearchActive && !selectedUF && (
          <div className="text-center py-8 text-gray-500">
            Selecione uma UF para começar.
          </div>
        )}

        {!isSearchActive && selectedUF && !selectedRota && (
          <div className="text-center py-8 text-gray-500">
            Selecione uma Rota para visualizar os empreendimentos.
          </div>
        )}

        {!displayLoading && displayList?.length === 0 && (isSearchActive || (selectedUF && selectedRota)) && (
          <div className="text-center py-8 text-gray-500">
            Nenhum empreendimento encontrado.
          </div>
        )}

        {/* Lista de empreendimentos */}
        {displayList && displayList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 px-1">
              <Route className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">
                {displayList.length} empreendimento{displayList.length !== 1 ? 's' : ''}
              </span>
            </div>

            {displayList.map(emp => (
              <Card
                key={emp.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => navigate(`/coletor/empreendimento/${emp.id}`)}
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
        )}
      </div>
    </div>
  )
}
