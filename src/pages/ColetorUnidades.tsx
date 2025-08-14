import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Home, User, FileText } from 'lucide-react'

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

export default function ColetorUnidades() {
  const { empreendimentoId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const empreendimento = location.state?.empreendimento as Empreendimento

  useEffect(() => {
    if (empreendimentoId) {
      fetchClientes()
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

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .eq('status', 'ativo')
        .order('identificacao_unidade')

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar unidades",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selecionarUnidade = (cliente: Cliente) => {
    navigate(`/coletor/leitura/${cliente.id}`, {
      state: { 
        cliente, 
        empreendimento 
      }
    })
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
        <div className="space-y-3">
          {filteredClientes.map((cliente) => (
            <Card 
              key={cliente.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => selecionarUnidade(cliente)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium text-gray-900 flex items-center">
                      <Home className="w-4 h-4 mr-2 text-primary" />
                      {cliente.identificacao_unidade}
                    </CardTitle>
                    {cliente.nome && (
                      <CardDescription className="text-sm text-gray-600 mt-1 flex items-center">
                        <User className="w-3 h-3 mr-2" />
                        {cliente.nome}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {cliente.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    Toque para registrar leitura
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
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