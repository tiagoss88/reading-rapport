import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, Wrench, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Layout from '@/components/Layout'

// Mock data for demonstration
const agendamentos = [
  {
    id: '1',
    tipo_servico: 'Religação',
    cliente: 'João Silva - Apto 101',
    endereco: 'Rua das Flores, 123 - Apto 101',
    data: '2024-01-16',
    hora: '09:00',
    status: 'agendado',
    observacoes: 'Cliente solicitou religação após quitação'
  },
  {
    id: '2',
    tipo_servico: 'Visita Técnica',
    cliente: 'Maria Santos - Casa 15',
    endereco: 'Rua das Palmeiras, 456 - Casa 15',
    data: '2024-01-16',
    hora: '14:30',
    status: 'em_andamento',
    observacoes: 'Verificar vazamento reportado'
  },
  {
    id: '3',
    tipo_servico: 'Corte',
    cliente: 'Pedro Oliveira - Apto 205',
    endereco: 'Av. Central, 789 - Apto 205',
    data: '2024-01-17',
    hora: '10:15',
    status: 'agendado',
    observacoes: 'Corte por inadimplência - 3 meses em atraso'
  },
  {
    id: '4',
    tipo_servico: 'Instalação',
    cliente: 'Ana Costa - Casa 8',
    endereco: 'Rua Nova, 321 - Casa 8',
    data: '2024-01-17',
    hora: '16:00',
    status: 'agendado',
    observacoes: 'Nova instalação - cliente novo'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'agendado':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'em_andamento':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'concluido':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'agendado':
      return 'Agendado'
    case 'em_andamento':
      return 'Em Andamento'
    case 'concluido':
      return 'Concluído'
    default:
      return status
  }
}

export default function Agendamentos() {
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroData, setFiltroData] = useState('')

  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const matchStatus = filtroStatus === 'todos' || agendamento.status === filtroStatus
    const matchData = !filtroData || agendamento.data === filtroData
    return matchStatus && matchData
  })

  return (
    <Layout title="Agendamentos">
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <input
                  type="date"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFiltroStatus('todos')
                    setFiltroData('')
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agendamentosFiltrados.map((agendamento) => (
            <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      {agendamento.tipo_servico}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {agendamento.cliente}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(agendamento.status)}>
                    {getStatusLabel(agendamento.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(agendamento.data).toLocaleDateString('pt-BR')}</span>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{agendamento.hora}</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{agendamento.endereco}</span>
                  </div>
                </div>

                {agendamento.observacoes && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm">{agendamento.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Editar
                  </Button>
                  {agendamento.status === 'agendado' && (
                    <Button size="sm" className="flex-1">
                      Iniciar
                    </Button>
                  )}
                  {agendamento.status === 'em_andamento' && (
                    <Button size="sm" className="flex-1">
                      Finalizar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {agendamentosFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum agendamento encontrado com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}