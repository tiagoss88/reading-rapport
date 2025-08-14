import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Clock, MapPin, Plus, Building2, Home } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
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
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  
  const [formData, setFormData] = useState({
    tipo_servico: '',
    empreendimento_id: '',
    cliente_id: '',
    data_agendamento: '',
    hora_agendamento: '',
    endereco: '',
    observacoes: ''
  })

  // Carregar empreendimentos ao montar o componente
  useEffect(() => {
    const fetchEmpreendimentos = async () => {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .order('nome')
      
      if (error) {
        toast({
          title: "Erro ao carregar empreendimentos",
          description: error.message,
          variant: "destructive"
        })
      } else {
        setEmpreendimentos(data || [])
      }
    }

    fetchEmpreendimentos()
  }, [])

  // Carregar clientes quando empreendimento for selecionado
  useEffect(() => {
    const fetchClientes = async () => {
      if (!formData.empreendimento_id) {
        setClientes([])
        return
      }

      setLoadingClientes(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, identificacao_unidade')
        .eq('empreendimento_id', formData.empreendimento_id)
        .eq('status', 'ativo')
        .order('identificacao_unidade')
      
      if (error) {
        toast({
          title: "Erro ao carregar clientes",
          description: error.message,
          variant: "destructive"
        })
      } else {
        setClientes(data || [])
      }
      setLoadingClientes(false)
    }

    fetchClientes()
  }, [formData.empreendimento_id])

  const handleEmpreendimentoChange = (value: string) => {
    setFormData({
      ...formData,
      empreendimento_id: value,
      cliente_id: '', // Limpar seleção de cliente ao mudar empreendimento
      endereco: ''
    })
  }

  const handleClienteChange = (value: string) => {
    const cliente = clientes.find(c => c.id === value)
    setFormData({
      ...formData,
      cliente_id: value,
      endereco: cliente ? `${cliente.identificacao_unidade}` : ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    toast({
      title: "Serviço criado com sucesso",
      description: "O serviço foi agendado e aparecerá na agenda."
    })
    
    // Reset form
    setFormData({
      tipo_servico: '',
      empreendimento_id: '',
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
                  <Label htmlFor="empreendimento_id" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Empreendimento
                  </Label>
                  <Select 
                    value={formData.empreendimento_id} 
                    onValueChange={handleEmpreendimentoChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o empreendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {empreendimentos.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_id" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Unidade/Cliente
                </Label>
                <Select 
                  value={formData.cliente_id} 
                  onValueChange={handleClienteChange}
                  disabled={!formData.empreendimento_id || loadingClientes}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !formData.empreendimento_id 
                          ? "Primeiro selecione um empreendimento" 
                          : loadingClientes 
                          ? "Carregando unidades..." 
                          : "Selecione a unidade"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.identificacao_unidade} - {cliente.nome || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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