import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Clock, MapPin, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Layout from '@/components/Layout'

const tiposServico = [
  { value: 'religacao', label: 'Religação' },
  { value: 'bloqueio', label: 'Bloqueio (Pedido do Cliente)' },
  { value: 'corte', label: 'Corte (Falta de Pagamento)' },
  { value: 'visita_tecnica', label: 'Visita Técnica' },
  { value: 'instalacao', label: 'Instalação' }
]

export default function CriarServico() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    tipo_servico: '',
    cliente_id: '',
    data_agendamento: '',
    hora_agendamento: '',
    endereco: '',
    observacoes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    toast({
      title: "Serviço criado com sucesso",
      description: "O serviço foi agendado e aparecerá na agenda."
    })
    
    // Reset form
    setFormData({
      tipo_servico: '',
      cliente_id: '',
      data_agendamento: '',
      hora_agendamento: '',
      endereco: '',
      observacoes: ''
    })
  }

  return (
    <Layout title="Criar Serviço">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Serviço
            </CardTitle>
            <CardDescription>
              Cadastre um novo serviço para uma unidade específica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_servico">Tipo de Serviço</Label>
                  <Select 
                    value={formData.tipo_servico} 
                    onValueChange={(value) => setFormData({...formData, tipo_servico: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposServico.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Unidade/Cliente</Label>
                  <Input
                    id="cliente_id"
                    placeholder="Buscar unidade..."
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_agendamento" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Data do Agendamento
                  </Label>
                  <Input
                    id="data_agendamento"
                    type="date"
                    value={formData.data_agendamento}
                    onChange={(e) => setFormData({...formData, data_agendamento: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_agendamento" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário
                  </Label>
                  <Input
                    id="hora_agendamento"
                    type="time"
                    value={formData.hora_agendamento}
                    onChange={(e) => setFormData({...formData, hora_agendamento: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </Label>
                <Input
                  id="endereco"
                  placeholder="Endereço da unidade"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais sobre o serviço..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Criar Serviço
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}