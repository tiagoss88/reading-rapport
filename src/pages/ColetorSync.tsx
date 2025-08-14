import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Wifi, WifiOff, RefreshCw, Building2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Empreendimento {
  id: string
  nome: string
  endereco: string
  tipo_gas?: string
  clientesCount?: number
}

export default function ColetorSync() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncData = async () => {
    if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "Conecte-se à internet para sincronizar os dados",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Buscar empreendimentos
      const { data: empreendimentosData, error: empreendimentosError } = await supabase
        .from('empreendimentos')
        .select('*')
        .order('nome')

      if (empreendimentosError) throw empreendimentosError

      // Buscar contagem de clientes para cada empreendimento
      const empreendimentosComContagem = await Promise.all(
        (empreendimentosData || []).map(async (emp) => {
          const { count } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('empreendimento_id', emp.id)
            .eq('status', 'ativo')

          return {
            ...emp,
            clientesCount: count || 0
          }
        })
      )

      setEmpreendimentos(empreendimentosComContagem)
      
      toast({
        title: "Sincronização concluída",
        description: `${empreendimentosComContagem.length} empreendimento(s) sincronizado(s)`,
      })
    } catch (error: any) {
      console.error('Erro na sincronização:', error)
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selecionarEmpreendimento = (empreendimento: Empreendimento) => {
    navigate(`/coletor/unidades/${empreendimento.id}`, { 
      state: { empreendimento } 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Coletor de Leituras</h1>
          <p className="text-gray-600">Sincronize os dados para começar</p>
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

        {/* Botão de Sincronização */}
        <Button 
          onClick={syncData} 
          disabled={loading || !isOnline}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Sincronizar Dados
            </>
          )}
        </Button>

        {/* Lista de Empreendimentos */}
        {empreendimentos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Empreendimentos Disponíveis
            </h2>
            
            {empreendimentos.map((empreendimento) => (
              <Card 
                key={empreendimento.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => selecionarEmpreendimento(empreendimento)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium text-gray-900">
                        {empreendimento.nome}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-1">
                        {empreendimento.endereco}
                      </CardDescription>
                    </div>
                    <Building2 className="w-5 h-5 text-primary ml-2 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {empreendimento.clientesCount} unidade(s)
                      </span>
                    </div>
                    {empreendimento.tipo_gas && (
                      <Badge variant="outline" className="text-xs">
                        {empreendimento.tipo_gas}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {empreendimentos.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nenhum empreendimento encontrado.
                <br />
                Clique em "Sincronizar Dados" para carregar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}