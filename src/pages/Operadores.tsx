import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Pencil, Trash2, KeyRound, Copy, Check } from 'lucide-react'
import { operadorSchema } from '@/lib/validation'
import { z } from 'zod'

interface Operador {
  id: string
  user_id: string
  nome: string
  email: string
  status: string
  created_at: string
  updated_at: string
}

export default function Operadores() {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOperador, setEditingOperador] = useState<Operador | null>(null)
  const [resetPasswordOperador, setResetPasswordOperador] = useState<Operador | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    status: 'ativo',
    password: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchOperadores()
  }, [])

  const fetchOperadores = async () => {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOperadores(data || [])
    } catch (error) {
      console.error('Erro ao buscar operadores:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar operadores",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate input data - remove empty password to avoid min length validation on edit
      const dataToValidate = { ...formData };
      if (!dataToValidate.password) {
        delete (dataToValidate as any).password;
      }
      const validatedData = operadorSchema.parse(dataToValidate)

      if (editingOperador) {
        // Check if email changed
        const emailChanged = validatedData.email !== editingOperador.email

        if (emailChanged) {
          // Update email via edge function (Auth + table)
          const { data, error: fnError } = await supabase.functions.invoke('update-operador-email', {
            body: {
              operador_id: editingOperador.id,
              new_email: validatedData.email
            }
          })

          if (fnError) throw fnError
          if (data?.error) throw new Error(data.error)
        }

        // Update other fields in operadores table
        const { error } = await supabase
          .from('operadores')
          .update({
            nome: validatedData.nome,
            ...(!emailChanged && { email: validatedData.email }),
            status: validatedData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOperador.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: emailChanged ? "Operador e email atualizados com sucesso" : "Operador atualizado com sucesso"
        })
      } else {
        // Criar novo operador usando edge function
        if (!validatedData.password) {
          toast({
            title: "Erro",
            description: "Senha é obrigatória para novo operador",
            variant: "destructive"
          })
          return
        }

        const { data, error: functionError } = await supabase.functions.invoke('create-operador', {
          body: {
            nome: validatedData.nome,
            email: validatedData.email,
            password: validatedData.password,
            status: validatedData.status
          }
        })

        if (functionError) throw functionError

        if (data?.error) {
          throw new Error(data.error)
        }

        toast({
          title: "Sucesso",
          description: "Operador criado com sucesso"
        })
      }

      // Limpar formulário e fechar dialog
      setFormData({ nome: '', email: '', status: 'ativo', password: '' })
      setEditingOperador(null)
      setIsDialogOpen(false)
      fetchOperadores()
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0]?.message || "Dados inválidos",
          variant: "destructive"
        })
      } else {
        console.error('Erro ao salvar operador:', error)
        toast({
          title: "Erro",
          description: error.message || "Erro ao salvar operador",
          variant: "destructive"
        })
      }
    }
  }

  const handleEdit = (operador: Operador) => {
    setEditingOperador(operador)
    setFormData({
      nome: operador.nome,
      email: operador.email,
      status: operador.status,
      password: ''
    })
    setIsDialogOpen(true)
  }

  const handleNewOperador = () => {
    setEditingOperador(null)
    setFormData({ nome: '', email: '', status: 'ativo', password: '' })
    setIsDialogOpen(true)
  }

  const handleDelete = async (operador: Operador) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-operador', {
        body: { operador_id: operador.id }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast({
        title: "Sucesso",
        description: "Operador excluído com sucesso"
      })

      fetchOperadores()
    } catch (error: any) {
      console.error('Erro ao excluir operador:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir operador",
        variant: "destructive"
      })
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordOperador) return

    setResettingPassword(true)
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { operador_id: resetPasswordOperador.id }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setGeneratedPassword(data.generated_password)
      toast({ title: "Sucesso", description: "Nova senha gerada com sucesso" })
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      toast({ title: "Erro", description: error.message || "Erro ao redefinir senha", variant: "destructive" })
      setResetPasswordOperador(null)
    } finally {
      setResettingPassword(false)
    }
  }

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredOperadores = operadores.filter(operador =>
    operador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operador.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Layout title="Operadores">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Carregando operadores...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Operadores">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestão de Operadores</h1>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewOperador}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Operador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingOperador ? 'Editar Operador' : 'Novo Operador'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite o nome do operador"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite o email do operador"
                    disabled={false}
                  />
                </div>

                {!editingOperador && (
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite a senha do operador"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingOperador ? 'Atualizar' : 'Criar'} Operador
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Operadores</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Pesquisar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperadores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum operador encontrado' : 'Nenhum operador cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperadores.map((operador) => (
                    <TableRow key={operador.id}>
                      <TableCell className="font-medium">
                        {operador.nome}
                      </TableCell>
                      <TableCell>{operador.email}</TableCell>
                      <TableCell>
                        <Badge variant={operador.status === 'ativo' ? 'default' : 'secondary'}>
                          {operador.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(operador.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(operador)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetPasswordOperador(operador)
                              setGeneratedPassword('')
                              setCopied(false)
                            }}
                            title="Redefinir Senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o operador <strong>{operador.nome}</strong>? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(operador)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de Redefinir Senha */}
        <Dialog open={!!resetPasswordOperador} onOpenChange={(open) => { if (!open) { setResetPasswordOperador(null); setGeneratedPassword('') } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha - {resetPasswordOperador?.nome}</DialogTitle>
            </DialogHeader>
            {generatedPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Nova senha gerada com sucesso. Copie e envie ao operador:</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-lg tracking-wider">
                  <span className="flex-1 select-all">{generatedPassword}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyPassword}>
                    {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button className="w-full" onClick={() => { setResetPasswordOperador(null); setGeneratedPassword('') }}>
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Deseja gerar uma nova senha aleatória para <strong>{resetPasswordOperador?.nome}</strong>?
                </p>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleResetPassword} className="flex-1" disabled={resettingPassword}>
                    {resettingPassword ? 'Gerando...' : 'Gerar Nova Senha'}
                  </Button>
                  <Button variant="outline" onClick={() => setResetPasswordOperador(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}