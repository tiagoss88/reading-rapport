import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  morador_nome: z.string().trim().max(255).optional().nullable(),
  telefone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().max(255).optional().nullable().refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: 'E-mail inválido' }
  ),
  cpf_cnpj: z.string().trim().max(30).optional().nullable(),
  bloco: z.string().trim().max(50).optional().nullable(),
  apartamento: z.string().trim().max(50).optional().nullable(),
  tipo_servico: z.string().trim().min(1, 'Informe o tipo de serviço').max(255),
  data_agendamento: z.string().optional().nullable(),
  status_atendimento: z.enum(['pendente', 'agendado', 'executado', 'cancelado']),
  turno: z.enum(['manha', 'tarde']).optional().nullable(),
  tecnico_id: z.string().optional().nullable(),
  observacao: z.string().max(1000).optional().nullable()
})

type FormData = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  servico: {
    id: string
    condominio_nome_original: string
    bloco?: string | null
    apartamento?: string | null
    morador_nome?: string | null
    telefone?: string | null
    email?: string | null
    cpf_cnpj?: string | null
    tipo_servico: string
    data_agendamento?: string | null
    status_atendimento: string
    turno?: string | null
    tecnico_id?: string | null
    observacao?: string | null
  }
}

export default function ServicoNacionalGasDialog({ open, onOpenChange, servico }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: operadores } = useQuery({
    queryKey: ['operadores-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome', { ascending: true })

      if (error) throw error
      return data
    }
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      morador_nome: '',
      telefone: '',
      email: '',
      cpf_cnpj: '',
      bloco: '',
      apartamento: '',
      tipo_servico: '',
      data_agendamento: '',
      status_atendimento: 'pendente',
      turno: undefined,
      tecnico_id: '',
      observacao: ''
    }
  })

  useEffect(() => {
    if (servico) {
      form.reset({
        morador_nome: servico.morador_nome || '',
        telefone: servico.telefone || '',
        email: servico.email || '',
        cpf_cnpj: servico.cpf_cnpj || '',
        bloco: servico.bloco || '',
        apartamento: servico.apartamento || '',
        tipo_servico: servico.tipo_servico || '',
        data_agendamento: servico.data_agendamento || '',
        status_atendimento: servico.status_atendimento as any,
        turno: (servico.turno as any) || undefined,
        tecnico_id: servico.tecnico_id || '',
        observacao: servico.observacao || ''
      })
    }
  }, [servico, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('servicos_nacional_gas')
        .update({
          morador_nome: data.morador_nome?.trim() || null,
          telefone: data.telefone?.trim() || null,
          email: data.email?.trim() || null,
          cpf_cnpj: data.cpf_cnpj?.trim() || null,
          bloco: data.bloco?.trim() || null,
          apartamento: data.apartamento?.trim() || null,
          tipo_servico: data.tipo_servico.trim(),
          data_agendamento: data.data_agendamento || null,
          status_atendimento: data.status_atendimento,
          turno: data.turno || null,
          tecnico_id: data.tecnico_id || null,
          observacao: data.observacao || null
        })
        .eq('id', servico.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-nacional-gas'] })
      toast({ title: 'Serviço atualizado com sucesso' })
      onOpenChange(false)
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar serviço', variant: 'destructive' })
    }
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Editar Serviço</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[78vh] px-6">
          <div className="mb-4 p-3 bg-muted rounded-md text-sm">
            <p><strong>Condomínio:</strong> {servico.condominio_nome_original}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-4">
              {/* Dados do Cliente */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Dados do Cliente
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="morador_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Morador</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do morador" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf_cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF / CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bloco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bloco</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: A, HIBISCO" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apartamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 2206" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tipo_servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Instalação Interna, Manutenção..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Agendamento */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Agendamento
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_agendamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Agendamento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="turno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manha">Manhã</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tecnico_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Técnico Responsável</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === '_none' ? null : val)}
                        value={field.value || '_none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um técnico" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">Nenhum</SelectItem>
                          {operadores?.map(op => (
                            <SelectItem key={op.id} value={op.id}>{op.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status_atendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="executado">Executado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 pb-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
