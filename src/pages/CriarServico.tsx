import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Plus, Building2, Home, Check, ChevronsUpDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'
import { servicoSchema } from '@/lib/validation'
import { z } from 'zod'


export default function CriarServico() {
  const { toast } = useToast()
  const [tiposServico, setTiposServico] = useState<any[]>([])
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [openEmpreendimento, setOpenEmpreendimento] = useState(false)
  const [openCliente, setOpenCliente] = useState(false)
  
  const [formData, setFormData] = useState({
    tipo_servico: '',
    empreendimento_id: '',
    cliente_id: '',
    data_agendamento: '',
    preco_servico: 0,
    observacoes: ''
  })

  // Carregar tipos de serviço e empreendimentos ao montar o componente
  useEffect(() => {
    const fetchData = async () => {
      // Buscar tipos de serviço
      const { data: tiposData, error: tiposError } = await supabase
        .from('tipos_servico')
        .select('id, nome, preco_padrao')
        .eq('status', 'ativo')
        .order('nome')
      
      if (tiposError) {
        toast({
          title: "Erro ao carregar tipos de serviço",
          description: tiposError.message,
          variant: "destructive"
        })
      } else {
        setTiposServico(tiposData || [])
      }

      // Buscar empreendimentos
      const { data: empData, error: empError } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .order('nome')
      
      if (empError) {
        toast({
          title: "Erro ao carregar empreendimentos",
          description: empError.message,
          variant: "destructive"
        })
      } else {
        setEmpreendimentos(empData || [])
      }
    }

    fetchData()
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
      cliente_id: '' // Limpar seleção de cliente ao mudar empreendimento
    })
    setOpenEmpreendimento(false)
  }

  const handleClienteChange = (value: string) => {
    setFormData({
      ...formData,
      cliente_id: value
    })
    setOpenCliente(false)
  }

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
    
    try {
      // Validate input data
      const validatedData = servicoSchema.parse({
        ...formData,
        observacoes: formData.observacoes || ''
      })

      const { error } = await supabase
        .from('servicos')
        .insert({
          tipo_servico: validatedData.tipo_servico,
          empreendimento_id: validatedData.empreendimento_id,
          cliente_id: validatedData.cliente_id,
          data_agendamento: validatedData.data_agendamento,
          preco_servico: validatedData.preco_servico || null,
          observacoes: validatedData.observacoes || null
        })

      if (error) {
        toast({
          title: "Erro ao criar serviço",
          description: error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Serviço criado com sucesso",
        description: "O serviço foi agendado e aparecerá na agenda."
      })

      // Enviar push notification para operadores
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: 'Novo Serviço',
            body: `Serviço "${validatedData.tipo_servico}" agendado para ${validatedData.data_agendamento}`,
            url: '/coletor/servicos'
          }
        })
      } catch (pushErr) {
        console.error('Erro ao enviar push notification:', pushErr)
      }
      
      // Reset form
      setFormData({
        tipo_servico: '',
        empreendimento_id: '',
        cliente_id: '',
        data_agendamento: '',
        preco_servico: 0,
        observacoes: ''
      })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0]?.message || "Dados inválidos",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro ao criar serviço",
          description: error.message || "Tente novamente",
          variant: "destructive"
        })
      }
    }
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
                  <Label htmlFor="empreendimento_id" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Empreendimento
                  </Label>
                  <Popover open={openEmpreendimento} onOpenChange={setOpenEmpreendimento}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openEmpreendimento}
                        className="w-full justify-between"
                      >
                        {formData.empreendimento_id
                          ? empreendimentos.find((emp) => emp.id === formData.empreendimento_id)?.nome
                          : "Selecione o empreendimento..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar empreendimento..." />
                        <CommandList>
                          <CommandEmpty>Nenhum empreendimento encontrado.</CommandEmpty>
                          <CommandGroup>
                            {empreendimentos.map((emp) => (
                              <CommandItem
                                key={emp.id}
                                value={emp.nome}
                                onSelect={() => handleEmpreendimentoChange(emp.id)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.empreendimento_id === emp.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {emp.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_id" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Unidade/Cliente
                </Label>
                <Popover open={openCliente} onOpenChange={setOpenCliente}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCliente}
                      className="w-full justify-between"
                      disabled={!formData.empreendimento_id || loadingClientes}
                    >
                      {formData.cliente_id && clientes.length > 0
                        ? (() => {
                            const cliente = clientes.find((c) => c.id === formData.cliente_id)
                            return cliente ? `${cliente.identificacao_unidade} - ${cliente.nome || 'Sem nome'}` : "Selecione a unidade..."
                          })()
                        : !formData.empreendimento_id 
                        ? "Primeiro selecione um empreendimento" 
                        : loadingClientes 
                        ? "Carregando unidades..." 
                        : "Selecione a unidade..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar unidade..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                        <CommandGroup>
                          {clientes.map((cliente) => (
                            <CommandItem
                              key={cliente.id}
                              value={`${cliente.identificacao_unidade} ${cliente.nome || ''}`}
                              onSelect={() => handleClienteChange(cliente.id)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.cliente_id === cliente.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {cliente.identificacao_unidade} - {cliente.nome || 'Sem nome'}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  <Label htmlFor="preco_servico">Preço do Serviço (R$)</Label>
                  <Input
                    id="preco_servico"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_servico || 0}
                    onChange={(e) => setFormData({...formData, preco_servico: parseFloat(e.target.value) || 0})}
                    placeholder="150.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Preço ajustado automaticamente ao selecionar o tipo
                  </p>
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