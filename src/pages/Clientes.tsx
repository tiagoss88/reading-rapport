import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Edit, Trash2, Upload, History } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, removeMask } from '@/lib/formatters'
import BulkCreateDialog from '@/components/clientes/BulkCreateDialog'
import ClienteHistorico from '@/components/clientes/ClienteHistorico'

interface Cliente {
  id: string
  identificacao_unidade: string
  nome?: string
  cpf?: string
  status: string
  empreendimento_id: string
  leitura_inicial?: number
  created_at: string
  updated_at: string
  empreendimentos?: {
    nome: string
  }
}

interface Empreendimento {
  id: string
  nome: string
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [selectedClienteHistorico, setSelectedClienteHistorico] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    identificacao_unidade: '',
    nome: '',
    cpf: '',
    status: 'ativo',
    empreendimento_id: '',
    leitura_inicial: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar empreendimentos
      const { data: empreendimentosData, error: empreendimentosError } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .order('nome')

      if (empreendimentosError) throw empreendimentosError
      setEmpreendimentos(empreendimentosData || [])

      // Buscar clientes com dados do empreendimento
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select(`
          *,
          empreendimentos:empreendimento_id (nome)
        `)
        .order('created_at', { ascending: false })

      if (clientesError) throw clientesError
      setClientes(clientesData || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
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
      if (editingCliente) {
        const dataToUpdate = {
          ...formData,
          cpf: formData.cpf ? removeMask(formData.cpf) : null,
          leitura_inicial: parseFloat(formData.leitura_inicial) || 0
        }
        const { error } = await supabase
          .from('clientes')
          .update(dataToUpdate)
          .eq('id', editingCliente.id)

        if (error) throw error
        
        toast({
          title: "Cliente atualizado!",
          description: "As alterações foram salvas com sucesso.",
        })
      } else {
        const dataToInsert = {
          ...formData,
          cpf: formData.cpf ? removeMask(formData.cpf) : null,
          leitura_inicial: parseFloat(formData.leitura_inicial) || 0
        }
        const { error } = await supabase
          .from('clientes')
          .insert([dataToInsert])

        if (error) throw error
        
        toast({
          title: "Cliente criado!",
          description: "O novo cliente foi adicionado com sucesso.",
        })
      }

      fetchData()
      setDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cliente",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast({
        title: "Cliente excluído!",
        description: "O cliente foi removido com sucesso.",
      })
      
      fetchData()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      identificacao_unidade: cliente.identificacao_unidade,
      nome: cliente.nome || '',
      cpf: cliente.cpf ? formatCPF(cliente.cpf) : '',
      status: cliente.status,
      empreendimento_id: cliente.empreendimento_id,
      leitura_inicial: cliente.leitura_inicial?.toString() || '0'
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingCliente(null)
    setFormData({
      identificacao_unidade: '',
      nome: '',
      cpf: '',
      status: 'ativo',
      empreendimento_id: '',
      leitura_inicial: ''
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default">Ativo</Badge>
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>
      case 'bloqueado':
        return <Badge variant="destructive">Bloqueado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const openHistoricoDialog = (cliente: Cliente) => {
    setSelectedClienteHistorico(cliente)
    setHistoricoDialogOpen(true)
  }

  return (
    <Layout title="Clientes">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie as unidades dos empreendimentos</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Cadastro em Massa
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Unidade
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? 'Editar Unidade' : 'Nova Unidade'}
              </DialogTitle>
              <DialogDescription>
                {editingCliente 
                  ? 'Atualize as informações da unidade' 
                  : 'Adicione uma nova unidade ao sistema'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="empreendimento">Empreendimento *</Label>
                <Select
                  value={formData.empreendimento_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, empreendimento_id: value }))}
                  required
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
              <div>
                <Label htmlFor="identificacao_unidade">Identificação da Unidade *</Label>
                <Input
                  id="identificacao_unidade"
                  value={formData.identificacao_unidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, identificacao_unidade: e.target.value }))}
                  placeholder="Ex: Apto 101, Bloco A, Casa 15"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome do Cliente</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                   value={formData.cpf}
                   onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                   placeholder="Ex: 123.456.789-00"
                   maxLength={14}
                />
              </div>
               <div>
                 <Label htmlFor="leitura_inicial">Leitura Inicial *</Label>
                 <Input
                   id="leitura_inicial"
                   type="number"
                   step="0.01"
                   min="0"
                   value={formData.leitura_inicial}
                   onChange={(e) => setFormData(prev => ({ ...prev, leitura_inicial: e.target.value }))}
                   placeholder="Ex: 1000.50"
                   required
                 />
               </div>
               <div>
                 <Label htmlFor="status">Status *</Label>
                 <Select
                   value={formData.status}
                   onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                   required
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="ativo">Ativo</SelectItem>
                     <SelectItem value="inativo">Inativo</SelectItem>
                     <SelectItem value="bloqueado">Bloqueado</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Lista de Unidades
          </CardTitle>
          <CardDescription>
            Total de {clientes.length} unidade(s) cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando unidades...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma unidade encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Nova Unidade" para adicionar a primeira
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.identificacao_unidade}
                    </TableCell>
                    <TableCell>
                      {cliente.nome || '-'}
                    </TableCell>
                     <TableCell>
                       {cliente.cpf ? formatCPF(cliente.cpf) : '-'}
                    </TableCell>
                    <TableCell>
                      {cliente.empreendimentos?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cliente.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openHistoricoDialog(cliente)}
                          title="Ver histórico"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(cliente)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cliente.id)}
                          title="Excluir"
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

      <BulkCreateDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        empreendimentos={empreendimentos}
        onSuccess={fetchData}
      />

      <ClienteHistorico
        open={historicoDialogOpen}
        onOpenChange={setHistoricoDialogOpen}
        cliente={selectedClienteHistorico}
      />
    </Layout>
  )
}