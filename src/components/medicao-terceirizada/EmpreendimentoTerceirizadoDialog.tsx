import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(500, 'Endereço muito longo'),
  uf: z.enum(['BA', 'CE'], { required_error: 'Selecione a UF' }),
  quantidade_medidores: z.coerce.number().int().min(0, 'Quantidade inválida'),
  rota: z.coerce.number().int().min(1, 'Rota deve ser maior que 0')
})

type FormData = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  empreendimento?: {
    id: string
    nome: string
    endereco: string
    uf: string
    quantidade_medidores: number
    rota: number
  } | null
}

export default function EmpreendimentoTerceirizadoDialog({ open, onOpenChange, empreendimento }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!empreendimento

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      endereco: '',
      uf: 'BA',
      quantidade_medidores: 0,
      rota: 1
    }
  })

  useEffect(() => {
    if (empreendimento) {
      form.reset({
        nome: empreendimento.nome,
        endereco: empreendimento.endereco,
        uf: empreendimento.uf as 'BA' | 'CE',
        quantidade_medidores: empreendimento.quantidade_medidores,
        rota: empreendimento.rota
      })
    } else {
      form.reset({
        nome: '',
        endereco: '',
        uf: 'BA',
        quantidade_medidores: 0,
        rota: 1
      })
    }
  }, [empreendimento, form])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing && empreendimento) {
        const { error } = await supabase
          .from('empreendimentos_terceirizados')
          .update({
            nome: data.nome,
            endereco: data.endereco,
            uf: data.uf,
            quantidade_medidores: data.quantidade_medidores,
            rota: data.rota
          })
          .eq('id', empreendimento.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('empreendimentos_terceirizados')
          .insert({
            nome: data.nome,
            endereco: data.endereco,
            uf: data.uf,
            quantidade_medidores: data.quantidade_medidores,
            rota: data.rota
          })
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-terceirizados'] })
      toast({ title: isEditing ? 'Empreendimento atualizado' : 'Empreendimento criado' })
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error:', error)
      toast({ title: 'Erro ao salvar empreendimento', variant: 'destructive' })
    }
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Empreendimento' : 'Novo Empreendimento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Empreendimento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Residencial Solar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BA">Bahia (BA)</SelectItem>
                        <SelectItem value="CE">Ceará (CE)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rota de Origem</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="quantidade_medidores"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Medidores</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
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
