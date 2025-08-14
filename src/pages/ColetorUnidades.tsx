import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Search, Home, User, FileText, Edit, Trash2, CheckCircle } from 'lucide-react'

interface Cliente {
  id: string
  identificacao_unidade: string
  nome?: string
  cpf?: string
  status: string
}

interface Empreendimento {
  id: string
  nome: string
  endereco: string
  tipo_gas?: string
}

interface Leitura {
  id: string
  cliente_id: string
  leitura_atual: number
  observacao?: string
  tipo_observacao?: string
  data_leitura: string
  foto_url?: string
}

export default function ColetorUnidades() {
  const { empreendimentoId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [leituras, setLeituras] = useState<Leitura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const empreendimento = location.state?.empreendimento as Empreendimento

  useEffect(() => {
    if (empreendimentoId) {
      fetchClientesELeituras()
    }
  }, [empreendimentoId])

  // Configurar realtime para atualizar quando houver mudanças nas leituras
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leituras'
        },
        () => {
          // Recarregar leituras quando houver mudanças
          if (empreendimentoId) {
            fetchLeituras()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [empreendimentoId])

  useEffect(() => {
    // Filtrar clientes baseado no termo de busca
    const filtered = clientes.filter(cliente =>
      cliente.identificacao_unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.nome && cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredClientes(filtered)
  }, [clientes, searchTerm])

  const fetchClientesELeituras = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchClientes(), fetchLeituras()])
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .eq('status', 'ativo')
        .order('identificacao_unidade', { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar unidades",
        variant: "destructive"
      })
    }
  }

  const fetchLeituras = async () => {
    try {
      // Buscar o operador atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: operador } = await supabase
        .from('operadores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!operador) return

      // Buscar leituras do operador atual para este empreendimento
      const { data: clientesIds } = await supabase
        .from('clientes')
        .select('id')
        .eq('empreendimento_id', empreendimentoId)

      if (!clientesIds) return

      const clienteIds = clientesIds.map(c => c.id)

      const { data, error } = await supabase
        .from('leituras')
        .select('*')
        .eq('operador_id', operador.id)
        .in('cliente_id', clienteIds)
        .order('data_leitura', { ascending: false })

      if (error) throw error
      setLeituras(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar leituras:', error)
    }
  }

  const temLeitura = (clienteId: string) => {
    return leituras.some(leitura => leitura.cliente_id === clienteId)
  }

  const getLeitura = (clienteId: string) => {
    return leituras.find(leitura => leitura.cliente_id === clienteId)
  }

  const selecionarUnidade = (cliente: Cliente) => {
    const leitura = getLeitura(cliente.id)
    
    navigate(`/coletor/leitura/${cliente.id}`, {
      state: { 
        cliente, 
        empreendimento,
        leituraExistente: leitura || null
      }
    })
  }

  const deletarLeitura = async (leituraId: string) => {
    try {
      const { error } = await supabase
        .from('leituras')
        .delete()
        .eq('id', leituraId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Leitura deletada com sucesso!"
      })

      // As leituras serão atualizadas automaticamente via realtime
    } catch (error: any) {
      console.error('Erro ao deletar leitura:', error)
      toast({
        title: "Erro",
        description: "Falha ao deletar leitura",
        variant: "destructive"
      })
    }
  }

  const voltarParaEmpreendimentos = () => {
    navigate('/coletor-sync')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando unidades...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={voltarParaEmpreendimentos}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {empreendimento?.nome || 'Unidades'}
            </h1>
            <p className="text-sm text-gray-600">
              Selecione uma unidade para realizar a leitura
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por unidade ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Resumo */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de unidades</p>
                <p className="text-2xl font-bold text-primary">{clientes.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Filtradas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredClientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Unidades */}
        <div className="space-y-2">
          {filteredClientes.map((cliente) => {
            const leituraColetada = temLeitura(cliente.id)
            const leitura = getLeitura(cliente.id)
            
            return (
              <Card 
                key={cliente.id}
                className="hover:shadow-md transition-shadow animate-fade-in"
              >
                <CardHeader className="pb-2 p-4">
                  {/* Header Superior */}
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => selecionarUnidade(cliente)}
                    >
                      <CardTitle className="text-base font-medium text-gray-900 flex items-center">
                        <Home className="w-4 h-4 mr-2 text-primary" />
                        {cliente.identificacao_unidade}
                        {leituraColetada && (
                          <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                        )}
                      </CardTitle>
                      {cliente.nome && (
                        <CardDescription className="text-sm text-gray-600 mt-1 flex items-center">
                          <User className="w-3 h-3 mr-2" />
                          {cliente.nome}
                        </CardDescription>
                      )}
                    </div>
                    
                    {/* Status Badge - Apenas o status da unidade */}
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium ${
                        cliente.status === 'ativo' 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : cliente.status === 'bloqueado'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {cliente.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Footer Inferior - Ações de leitura */}
                  {leituraColetada && leitura && (
                    <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-gray-100">
                      {/* Badge Coletado */}
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium bg-blue-100 text-blue-800 border-blue-300 animate-scale-in"
                      >
                        COLETADO
                      </Badge>

                      {/* Ações para leituras coletadas */}
                      <div className="flex items-center space-x-1">
                        {/* Botão Editar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-100 hover-scale"
                          onClick={(e) => {
                            e.stopPropagation()
                            selecionarUnidade(cliente)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Botão Deletar */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-800 hover:bg-red-100 hover-scale"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="animate-scale-in">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar a leitura da unidade {cliente.identificacao_unidade}? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletarLeitura(leitura.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* Estado vazio */}
        {filteredClientes.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Nenhuma unidade encontrada para sua busca.' : 'Nenhuma unidade cadastrada neste empreendimento.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}