import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, User, Wrench, Filter, MoreHorizontal } from 'lucide-react'
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

        {/* Tabela de Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Lista de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Serviço</TableHead>
                  <TableHead>Cliente/Unidade</TableHead>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosFiltrados.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">
                      {agendamento.tipo_servico}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{agendamento.cliente}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {agendamento.endereco}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {agendamento.hora}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(agendamento.status)}>
                        {getStatusLabel(agendamento.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {agendamento.observacoes && (
                        <div className="text-sm text-muted-foreground truncate">
                          {agendamento.observacoes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            Editar
                          </DropdownMenuItem>
                          {agendamento.status === 'agendado' && (
                            <DropdownMenuItem>
                              Iniciar Serviço
                            </DropdownMenuItem>
                          )}
                          {agendamento.status === 'em_andamento' && (
                            <DropdownMenuItem>
                              Finalizar Serviço
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {agendamentosFiltrados.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum agendamento encontrado com os filtros aplicados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}