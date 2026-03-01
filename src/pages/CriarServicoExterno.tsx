import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Plus, User, Phone, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'

export default function CriarServicoExterno() {
  const { toast } = useToast()
  const [tiposServico, setTiposServico] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    tipo_servico: '',
    nome_cliente: '',
    telefone_cliente: '',
    endereco_servico: '',
    data_agendamento: '',
    hora_agendamento: '',
    preco_servico: 0,
    observacoes: ''
  })

  // Carregar tipos de serviço
  useEffect(() => {
    const fetchTiposServico = async () => {
      const { data, error } = await supabase
        .from('tipos_servico')
        .select('id, nome, preco_padrao')
        .eq('status', 'ativo')
        .order('nome')
      
      if (error) {
        toast({
          title: "Erro ao carregar tipos de serviço",
          description: error.message,
          variant: "destructive"
        })
      } else {
        setTiposServico(data || [])
      }
    }

    fetchTiposServico()
  }, [])

  const handleTipoServicoChange = (nome: string) => {
    const tipoSelecionado = tiposServico.find(t => t.nome === nome)
    setFormData({
      ...formData,
      tipo_servico: nome,
      preco_servico: tipoSelecionado?.preco_padrao || 0
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tipo_servico || !formData.nome_cliente || !formData.telefone_cliente || 
        !formData.endereco_servico || !formData.data_agendamento) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('servicos_externos')
        .insert({
          tipo_servico: formData.tipo_servico,
          nome_cliente: formData.nome_cliente,
          telefone_cliente: formData.telefone_cliente,
          endereco_servico: formData.endereco_servico,
          data_agendamento: formData.data_agendamento,
          hora_agendamento: formData.hora_agendamento || null,
          preco_servico: formData.preco_servico || null,
          observacoes: formData.observacoes || null
        })

      if (error) {
        toast({
          title: "Erro ao criar serviço externo",
          description: error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Serviço externo criado com sucesso",
        description: "O serviço foi agendado e aparecerá na lista de agendamentos."
      })

      // Enviar push notification para operadores
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: 'Novo Serviço Externo',
            body: `Serviço "${formData.tipo_servico}" agendado para ${formData.data_agendamento}`,
            url: '/coletor/servicos'
          }
        })
      } catch (pushErr) {
        console.error('Erro ao enviar push notification:', pushErr)
      }
      
      // Reset form
      setFormData({
        tipo_servico: '',
        nome_cliente: '',
        telefone_cliente: '',
        endereco_servico: '',
        data_agendamento: '',
        hora_agendamento: '',
        preco_servico: 0,
        observacoes: ''
      })
    } catch (error) {
      toast({
        title: "Erro ao criar serviço externo",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  return (
    <Layout title="Criar Serviço Externo">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Serviço Externo
            </CardTitle>
            <CardDescription>
              Cadastre um serviço para cliente não registrado no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_servico">Tipo de Serviço</Label>
                  <Select 
                    value={formData.tipo_servico} 
                    onValueChange={handleTipoServicoChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposServico.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nome}>
                          {tipo.nome} - R$ {tipo.preco_padrao?.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome_cliente" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome do Cliente
                  </Label>
                  <Input
                    id="nome_cliente"
                    placeholder="Nome completo do cliente"
                    value={formData.nome_cliente}
                    onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone_cliente" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone_cliente"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone_cliente}
                    onChange={(e) => setFormData({...formData, telefone_cliente: e.target.value})}
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endereco_servico" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço do Serviço
                </Label>
                <Textarea
                  id="endereco_servico"
                  placeholder="Endereço completo onde o serviço será realizado"
                  value={formData.endereco_servico}
                  onChange={(e) => setFormData({...formData, endereco_servico: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora_agendamento">Horário (Opcional)</Label>
                <Input
                  id="hora_agendamento"
                  type="time"
                  value={formData.hora_agendamento}
                  onChange={(e) => setFormData({...formData, hora_agendamento: e.target.value})}
                />
              </div>
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
                  Criar Serviço Externo
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