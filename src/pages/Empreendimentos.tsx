import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Building2, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Empreendimento {
  id: string
  nome: string
  endereco: string
  cnpj?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export default function Empreendimentos() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmpreendimento, setEditingEmpreendimento] = useState<Empreendimento | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cnpj: '',
    observacoes: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchEmpreendimentos()
  }, [])

  const fetchEmpreendimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmpreendimentos(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empreendimentos",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingEmpreendimento) {
        const { error } = await supabase
          .from('empreendimentos')
          .update(formData)
          .eq('id', editingEmpreendimento.id)

        if (error) throw error
        
        toast({
          title: "Empreendimento atualizado!",
          description: "As alterações foram salvas com sucesso.",
        })
      } else {
        const { error } = await supabase
          .from('empreendimentos')
          .insert([formData])

        if (error) throw error
        
        toast({
          title: "Empreendimento criado!",
          description: "O novo empreendimento foi adicionado com sucesso.",
        })
      }

      fetchEmpreendimentos()
      setDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar empreendimento",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este empreendimento?')) return

    try {
      const { error } = await supabase
        .from('empreendimentos')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast({
        title: "Empreendimento excluído!",
        description: "O empreendimento foi removido com sucesso.",
      })
      
      fetchEmpreendimentos()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir empreendimento",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (empreendimento: Empreendimento) => {
    setEditingEmpreendimento(empreendimento)
    setFormData({
      nome: empreendimento.nome,
      endereco: empreendimento.endereco,
      cnpj: empreendimento.cnpj || '',
      observacoes: empreendimento.observacoes || ''
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingEmpreendimento(null)
    setFormData({
      nome: '',
      endereco: '',
      cnpj: '',
      observacoes: ''
    })
  }

  return (
    <Layout title="Empreendimentos">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Empreendimentos</h1>
          <p className="text-muted-foreground">Gerencie os condomínios e prédios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Empreendimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEmpreendimento ? 'Editar Empreendimento' : 'Novo Empreendimento'}
              </DialogTitle>
              <DialogDescription>
                {editingEmpreendimento 
                  ? 'Atualize as informações do empreendimento' 
                  : 'Adicione um novo empreendimento ao sistema'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Condomínio Jardim das Flores"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="Ex: 12.345.678/0001-90"
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre o empreendimento"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEmpreendimento ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Lista de Empreendimentos
          </CardTitle>
          <CardDescription>
            Total de {empreendimentos.length} empreendimento(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando empreendimentos...</p>
            </div>
          ) : empreendimentos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum empreendimento encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Novo Empreendimento" para adicionar o primeiro
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empreendimentos.map((empreendimento) => (
                  <TableRow key={empreendimento.id}>
                    <TableCell className="font-medium">{empreendimento.nome}</TableCell>
                    <TableCell>{empreendimento.endereco}</TableCell>
                    <TableCell>{empreendimento.cnpj || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {empreendimento.observacoes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(empreendimento)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(empreendimento.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}