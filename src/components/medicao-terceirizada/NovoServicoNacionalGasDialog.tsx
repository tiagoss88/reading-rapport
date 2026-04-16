import { useState, useMemo } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

const formSchema = z.object({
  uf: z.enum(['BA', 'CE'], { required_error: 'Selecione a UF' }),
  fonte: z.enum(['particular', 'bg', 'ngd'], { required_error: 'Selecione a origem' }),
  condominio_nome_original: z.string().trim().min(1, 'Informe o condomínio').max(255),
  empreendimento_id: z.string().optional().nullable(),
  bloco: z.string().max(50).optional().nullable(),
  apartamento: z.string().max(50).optional().nullable(),
  morador_nome: z.string().max(255).optional().nullable(),
  telefone: z.string().max(30).optional().nullable(),
  email: z.string().email('Email inválido').max(255).optional().nullable().or(z.literal('')),
  tipo_servico: z.string().trim().min(1, 'Informe o tipo de serviço').max(255),
  data_solicitacao: z.string().optional().nullable(),
  data_agendamento: z.string().optional().nullable(),
  turno: z.enum(['manha', 'tarde']).optional().nullable(),
  tecnico_id: z.string().optional().nullable(),
  status_atendimento: z.enum(['pendente', 'agendado', 'executado', 'cancelado']),
  observacao: z.string().max(1000).optional().nullable()
})

type FormData = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NovoServicoNacionalGasDialog({ open, onOpenChange }: Props) {
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

  const { data: condominiosExistentes } = useQuery({
    queryKey: ['condominios-distintos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select('condominio_nome_original, empreendimento_id')
        .order('condominio_nome_original', { ascending: true })
      if (error) throw error
      return data || []
    }
  })

  const condominioNomes = useMemo(() => {
    const unique = [...new Set(condominiosExistentes?.map(d => d.condominio_nome_original).filter(Boolean))]
    return unique as string[]
  }, [condominiosExistentes])

  const condominioEmpreendimentoMap = useMemo(() => {
    const map: Record<string, string> = {}
    condominiosExistentes?.forEach(d => {
      if (d.condominio_nome_original && d.empreendimento_id) {
        map[d.condominio_nome_original] = d.empreendimento_id
      }
    })
    return map
  }, [condominiosExistentes])

  const [condominioPopoverOpen, setCondominioPopoverOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uf: undefined,
      fonte: undefined,
      condominio_nome_original: '',
      empreendimento_id: '',
      bloco: '',
      apartamento: '',
      morador_nome: '',
      telefone: '',
      email: '',
      tipo_servico: '',
      data_solicitacao: '',
      data_agendamento: '',
      turno: undefined,
      tecnico_id: '',
      status_atendimento: 'pendente',
      observacao: ''
    }
  })

  const condominioValue = form.watch('condominio_nome_original')

  const filteredCondominios = useMemo(() => {
    if (!condominioValue || condominioValue.length < 2) return []
    const search = condominioValue.toLowerCase()
    return (condominioNomes || []).filter(c => c.toLowerCase().includes(search)).slice(0, 10)
  }, [condominioValue, condominiosExistentes])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('servicos_nacional_gas')
        .insert({
          uf: data.uf,
          condominio_nome_original: data.condominio_nome_original,
          empreendimento_id: data.empreendimento_id || null,
          bloco: data.bloco || null,
          apartamento: data.apartamento || null,
          morador_nome: data.morador_nome || null,
          telefone: data.telefone || null,
          email: data.email || null,
          tipo_servico: data.tipo_servico,
          data_solicitacao: data.data_solicitacao || null,
          data_agendamento: data.data_agendamento || null,
          turno: data.turno || null,
          tecnico_id: data.tecnico_id || null,
          status_atendimento: data.status_atendimento,
          observacao: data.observacao || null,
          fonte: data.fonte
        })
      if (error) throw error
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicos-nacional-gas'] })
      toast({ title: 'Serviço cadastrado com sucesso' })

      // Enviar push notification
      try {
        const tecnicoNome = variables.tecnico_id
          ? operadores?.find(op => op.id === variables.tecnico_id)?.nome
          : null
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: 'Novo Serviço Nacional Gás',
            body: `Serviço "${variables.tipo_servico}" - ${variables.condominio_nome_original}${tecnicoNome ? ` (Técnico: ${tecnicoNome})` : ''}`,
            url: '/coletor/servicos',
            ...(variables.tecnico_id ? { operador_ids: [variables.tecnico_id] } : {})
          }
        })
      } catch (pushErr) {
        console.error('Erro ao enviar push notification:', pushErr)
      }

      form.reset()
      onOpenChange(false)
    },
    onError: () => {
      toast({ title: 'Erro ao cadastrar serviço', variant: 'destructive' })
    }
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Novo Serviço</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BA">BA</SelectItem>
                          <SelectItem value="CE">CE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fonte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="particular">Particular</SelectItem>
                          <SelectItem value="bg">BG</SelectItem>
                          <SelectItem value="ngd">NGD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Instalação, Manutenção..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="condominio_nome_original"
                render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Condomínio *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do condomínio"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            form.setValue('empreendimento_id', null)
                            if (e.target.value.length >= 2) {
                              setCondominioPopoverOpen(true)
                            } else {
                              setCondominioPopoverOpen(false)
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setCondominioPopoverOpen(false), 150)
                          }}
                          autoComplete="off"
                        />
                      </FormControl>
                      {condominioPopoverOpen && filteredCondominios.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md">
                          <ul className="max-h-[200px] overflow-y-auto p-1">
                            {filteredCondominios.map((nome) => (
                              <li
                                key={nome}
                                className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  field.onChange(nome)
                                  form.setValue('empreendimento_id', condominioEmpreendimentoMap[nome] || null)
                                  setCondominioPopoverOpen(false)
                                }}
                              >
                                {nome}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
              />


              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bloco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bloco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: A, B, 1..." {...field} value={field.value || ''} />
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
                        <Input placeholder="Ex: 101, 202..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="data_solicitacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Solicitação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

              <div className="grid grid-cols-2 gap-4">
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
                            <SelectValue placeholder="Selecione" />
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
              </div>

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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvando...' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
