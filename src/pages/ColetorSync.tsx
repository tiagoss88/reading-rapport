import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Smartphone, Wifi, WifiOff, RefreshCw, Building2, Users, ArrowLeft, Search, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Empreendimento {
  id: string
  nome: string
  endereco: string
  tipo_gas?: string
  clientesCount?: number
}

// Funções para gerenciar cache de sincronização
const getSyncedEmpreendimentos = (): string[] => {
  const data = localStorage.getItem('coletor_synced_empreendimentos')
  return data ? JSON.parse(data) : []
}

const setSyncedEmpreendimento = (id: string) => {
  const synced = getSyncedEmpreendimentos()
  if (!synced.includes(id)) {
    localStorage.setItem('coletor_synced_empreendimentos', JSON.stringify([...synced, id]))
    localStorage.setItem('coletor_sync_timestamp', new Date().toISOString())
  }
}

const clearSyncedEmpreendimentos = () => {
  localStorage.removeItem('coletor_synced_empreendimentos')
  localStorage.removeItem('coletor_sync_timestamp')
}

export default function ColetorSync() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [syncedIds, setSyncedIds] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Carregar apenas cache ao montar
    setSyncedIds(getSyncedEmpreendimentos())
    setLoading(false)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        loadEmpreendimentos(searchTerm)
      } else {
        setEmpreendimentos([])
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadEmpreendimentos = async (term: string) => {
    if (!term || term.trim().length < 2) {
      setEmpreendimentos([])
      return
    }

    setLoading(true)
    try {
      const searchPattern = `%${term.trim()}%`
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome, endereco, tipo_gas')
        .or(`nome.ilike.${searchPattern},endereco.ilike.${searchPattern}`)
        .order('nome')
        .limit(20)

      if (error) throw error

      setEmpreendimentos(data || [])
    } catch (error: any) {
      console.error('Erro ao buscar empreendimentos:', error)
      toast({
        title: "Erro na busca",
        description: error.message || "Falha ao buscar empreendimentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const syncEmpreendimento = async (empreendimento: Empreendimento) => {
    if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "Conecte-se à internet para sincronizar",
        variant: "destructive"
      })
      return
    }

    setSyncingId(empreendimento.id)
    try {
      // Buscar clientes do empreendimento
      const { count, error } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('empreendimento_id', empreendimento.id)
        .eq('status', 'ativo')

      if (error) throw error

      // Marcar como sincronizado
      setSyncedEmpreendimento(empreendimento.id)
      setSyncedIds(getSyncedEmpreendimentos())

      toast({
        title: "Sincronizado com sucesso",
        description: `${count || 0} unidade(s) encontrada(s)`,
      })

      // Navegar para as unidades
      navigate(`/coletor/unidades/${empreendimento.id}`, { 
        state: { empreendimento } 
      })
    } catch (error: any) {
      console.error('Erro na sincronização:', error)
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar empreendimento",
        variant: "destructive"
      })
    } finally {
      setSyncingId(null)
    }
  }

  const acessarEmpreendimento = (empreendimento: Empreendimento) => {
    navigate(`/coletor/unidades/${empreendimento.id}`, { 
      state: { empreendimento } 
    })
  }

  const handleClearCache = () => {
    clearSyncedEmpreendimentos()
    setSyncedIds([])
    toast({
      title: "Cache limpo",
      description: "Todas as sincronizações foram resetadas",
    })
  }

  // Busca já vem filtrada do banco
  const filteredEmpreendimentos = empreendimentos

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Botão de Retorno */}
        <div className="flex items-center justify-start">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/coletor')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Coletor de Leituras</h1>
          <p className="text-gray-600">Selecione o empreendimento para sincronizar</p>
        </div>

        {/* Status de Conexão */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Campo de Busca */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Digite o nome ou endereço do empreendimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-xs text-muted-foreground text-center">
              Digite pelo menos 2 caracteres para buscar
            </p>
          )}
        </div>

        {/* Lista de Empreendimentos */}
        {filteredEmpreendimentos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchTerm ? `${filteredEmpreendimentos.length} resultado(s)` : 'Empreendimentos Disponíveis'}
            </h2>
            
            {filteredEmpreendimentos.map((empreendimento) => {
              const isSynced = syncedIds.includes(empreendimento.id)
              const isSyncing = syncingId === empreendimento.id

              return (
                <Card 
                  key={empreendimento.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-medium text-gray-900">
                            {empreendimento.nome}
                          </CardTitle>
                          {isSynced && (
                            <Badge variant="default" className="bg-green-500 text-white gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Sincronizado
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          {empreendimento.endereco}
                        </CardDescription>
                      </div>
                      <Building2 className="w-5 h-5 text-primary ml-2 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {empreendimento.tipo_gas && (
                          <Badge variant="outline" className="text-xs">
                            {empreendimento.tipo_gas}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {isSynced ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => acessarEmpreendimento(empreendimento)}
                            disabled={!isOnline}
                          >
                            Acessar →
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => syncEmpreendimento(empreendimento)}
                            disabled={isSyncing || !isOnline}
                          >
                            {isSyncing ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                Sincronizando...
                              </>
                            ) : (
                              'Sincronizar →'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Botão para limpar cache */}
        {syncedIds.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar cache de sincronizações
          </Button>
        )}

        {/* Estado inicial vazio */}
        {empreendimentos.length === 0 && !loading && searchTerm.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Search className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  Busque o empreendimento
                </p>
                <p className="text-sm text-muted-foreground">
                  Digite o nome ou endereço do empreendimento para começar
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state durante busca */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
              <span>Buscando empreendimentos...</span>
            </CardContent>
          </Card>
        )}

        {/* Nenhum resultado encontrado */}
        {!loading && empreendimentos.length === 0 && searchTerm.length >= 2 && (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum empreendimento encontrado</p>
              <p className="text-sm text-muted-foreground">
                Tente buscar por outro termo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}