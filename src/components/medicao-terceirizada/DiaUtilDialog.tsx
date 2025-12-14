import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'

const formSchema = z.object({
  numero_rota: z.coerce.number().int().min(1, 'Rota deve ser maior que 0'),
  data: z.date({ required_error: 'Selecione uma data' })
})

type FormData = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  uf: string
  ano: number
  mes: number
}

export default function DiaUtilDialog({ open, onOpenChange, uf, ano, mes }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_rota: 1,
      data: undefined
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('dias_uteis')
        .insert({
          uf,
          ano,
          mes,
          numero_rota: data.numero_rota,
          data: format(data.data, 'yyyy-MM-dd')
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dias-uteis'] })
      toast({ title: 'Dia útil cadastrado com sucesso' })
      form.reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      console.error('Error:', error)
      if (error.message?.includes('duplicate')) {
        toast({ title: 'Esta rota já existe para este mês/UF', variant: 'destructive' })
      } else {
        toast({ title: 'Erro ao cadastrar dia útil', variant: 'destructive' })
      }
    }
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Dia Útil</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-muted rounded-md text-sm">
          <p><strong>UF:</strong> {uf}</p>
          <p><strong>Período:</strong> {mes.toString().padStart(2, '0')}/{ano}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="numero_rota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Rota</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="Ex: 1, 2, 3..." {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    A rota representa o dia útil do mês (Rota 01 = 1º dia útil)
                  </p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const dateMonth = date.getMonth() + 1
                          const dateYear = date.getFullYear()
                          return dateMonth !== mes || dateYear !== ano
                        }}
                        defaultMonth={new Date(ano, mes - 1)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
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
