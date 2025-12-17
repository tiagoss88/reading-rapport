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
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

const formSchema = z.object({
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted rounded-md text-sm space-y-1">
          <p><strong>Condomínio:</strong> {servico.condominio_nome_original}</p>
          {(servico.bloco || servico.apartamento) && (
            <p>
              <strong>Unidade:</strong> 
              {servico.bloco && ` Bloco ${servico.bloco}`}
              {servico.apartamento && ` - Apto ${servico.apartamento}`}
            </p>
          )}
          {servico.morador_nome && (
            <p><strong>Morador:</strong> {servico.morador_nome}</p>
          )}
          <p><strong>Tipo:</strong> {servico.tipo_servico}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    onValueChange={(val) => field.onChange(val === "_none" ? null : val)} 
                    value={field.value || "_none"}
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
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
