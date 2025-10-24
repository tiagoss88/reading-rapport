import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Wrench, Plus, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'
import { z } from 'zod'

const tipoServicoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  preco_padrao: z.number().min(0, 'Preço não pode ser negativo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  status: z.enum(['ativo', 'inativo'], { errorMap: () => ({ message: 'Status inválido' }) })
})

type TipoServico = {
  id?: string
  nome: string
  preco_padrao: number
  descricao?: string
  status: 'ativo' | 'inativo'
}

export default function TiposServico() {
  const { toast } = useToast()
  const [tiposServico, setTiposServico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TipoServico>({
    nome: '',
    preco_padrao: 0,
    descricao: '',
    status: 'ativo'
  })

  const fetchTiposServico = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tipos_servico')
      .select('*')
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
    setLoading(false)
  }

  useEffect(() => {
    fetchTiposServico()
  }, [])

  const resetForm = () => {
    setFormData({
      nome: '',
      preco_padrao: 0,
      descricao: '',
      status: 'ativo'
    })
    setEditando(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = tipoServicoSchema.parse(formData)

      if (editando) {
        const { error } = await supabase
          .from('tipos_servico')
          .update({
            nome: validatedData.nome,
            preco_padrao: validatedData.preco_padrao,
            descricao: validatedData.descricao || null,
            status: validatedData.status
          })
          .eq('id', editando)

        if (error) throw error

        toast({
          title: "Tipo de serviço atualizado",
          description: "As alterações foram salvas com sucesso."
        })
      } else {
        const { error } = await supabase
          .from('tipos_servico')
          .insert({
            nome: validatedData.nome,
            preco_padrao: validatedData.preco_padrao,
            descricao: validatedData.descricao || null,
            status: validatedData.status
          })

        if (error) throw error

        toast({
          title: "Tipo de serviço criado",
          description: "O novo tipo foi adicionado com sucesso."
        })
      }

      setDialogOpen(false)
      resetForm()
      fetchTiposServico()
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0]?.message || "Dados inválidos",
          variant: "destructive"
        })
      } else {
        toast({
          title: editando ? "Erro ao atualizar" : "Erro ao criar",
          description: error.message || "Tente novamente",
          variant: "destructive"
        })
      }
    }
  }

  const handleEdit = (tipo: any) => {
    setFormData({
      nome: tipo.nome,
      preco_padrao: tipo.preco_padrao,
      descricao: tipo.descricao || '',
      status: tipo.status
    })
    setEditando(tipo.id)
    setDialogOpen(true)
  }

  const handleNovoTipo = () => {
    resetForm()
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <Layout title="Tipos de Serviço">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando tipos de serviço...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Tipos de Serviço">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Tipos de Serviço
                </CardTitle>
                <CardDescription>
                  Gerencie os tipos de serviço e seus preços padrão
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open)
                if (!open) resetForm()
              }}>
                <DialogTrigger asChild>
                  <Button onClick={handleNovoTipo}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Tipo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editando ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
                      </DialogTitle>
                      <DialogDescription>
                        {editando 
                          ? 'Atualize as informações do tipo de serviço'
                          : 'Cadastre um novo tipo de serviço com preço padrão'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Serviço</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Ex: Instalação"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preco_padrao">Preço Padrão (R$)</Label>
                        <Input
                          id="preco_padrao"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.preco_padrao}
                          onChange={(e) => setFormData({ ...formData, preco_padrao: parseFloat(e.target.value) || 0 })}
                          placeholder="150.00"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição (Opcional)</Label>
                        <Textarea
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          placeholder="Descreva brevemente o serviço..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="status" className="flex-1">Status</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formData.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                          <Switch
                            id="status"
                            checked={formData.status === 'ativo'}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, status: checked ? 'ativo' : 'inativo' })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editando ? 'Salvar Alterações' : 'Criar Tipo'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço Padrão</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiposServico.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell>
                      R$ {tipo.preco_padrao?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground truncate">
                        {tipo.descricao || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={tipo.status === 'ativo' ? 'default' : 'secondary'}
                      >
                        {tipo.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(tipo)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {tiposServico.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum tipo de serviço cadastrado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
