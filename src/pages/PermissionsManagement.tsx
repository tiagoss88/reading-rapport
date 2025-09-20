import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { AppRole, AppPermission } from '@/contexts/PermissionsContext'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { User, Shield, Users, Settings } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface UserWithPermissions {
  id: string
  email: string
  roles: AppRole[]
  permissions: AppPermission[]
}

const roleLabels = {
  admin: 'Administrador',
  gestor_empreendimento: 'Gestor de Empreendimento',
  operador_completo: 'Operador Completo',
  operador_leitura: 'Operador de Leitura',
  operador_servicos: 'Operador de Serviços'
}

const permissionLabels = {
  view_dashboard: 'Ver Dashboard',
  manage_empreendimentos: 'Gerenciar Empreendimentos',
  manage_clientes: 'Gerenciar Clientes',
  view_leituras: 'Ver Leituras',
  create_leituras: 'Criar Leituras',
  manage_operadores: 'Gerenciar Operadores',
  create_servicos: 'Criar Serviços',
  manage_agendamentos: 'Gerenciar Agendamentos',
  coletor_leituras: 'Coletor de Leituras',
  coletor_servicos: 'Coletor de Serviços',
  view_agendamentos: 'Ver Agendamentos'
}

export default function PermissionsManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null)
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Get all operators from the operadores table
      const { data: operadores, error: operadoresError } = await supabase
        .from('operadores')
        .select('id, user_id, nome, email, status')

      if (operadoresError) {
        console.error('Error fetching operadores:', operadoresError)
        toast.error('Erro ao carregar operadores')
        return
      }

      const usersWithPermissions: UserWithPermissions[] = []

      for (const operador of operadores || []) {
        // Get user roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', operador.user_id)

        // Get user permissions
        const { data: userPermissions } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', operador.user_id)

        usersWithPermissions.push({
          id: operador.user_id,
          email: operador.email,
          roles: userRoles?.map(r => r.role as AppRole) || [],
          permissions: userPermissions?.map(p => p.permission as AppPermission) || []
        })
      }

      setUsers(usersWithPermissions)
    } catch (error) {
      console.error('Error fetching users and permissions:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })

      if (error) {
        console.error('Error assigning role:', error)
        toast.error('Erro ao atribuir role')
        return
      }

      toast.success('Role atribuído com sucesso')
      fetchUsers()
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error('Erro ao atribuir role')
    }
  }

  const removeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role)

      if (error) {
        console.error('Error removing role:', error)
        toast.error('Erro ao remover role')
        return
      }

      toast.success('Role removido com sucesso')
      fetchUsers()
    } catch (error) {
      console.error('Error removing role:', error)
      toast.error('Erro ao remover role')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <Layout title="Gerenciamento de Permissões">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Gerenciamento de Permissões">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Permissões</h1>
            <p className="text-muted-foreground">
              Gerencie roles e permissões dos usuários do sistema
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.roles.includes('admin')).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestores</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.roles.includes('gestor_empreendimento')).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operadores</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.roles.some(r => r.includes('operador'))).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários e Permissões</CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados e suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {roleLabels[role]}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Sem roles
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            Gerenciar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Gerenciar Permissões</DialogTitle>
                            <DialogDescription>
                              Usuário: {user.email}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label>Roles Atuais</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {user.roles.map((role) => (
                                  <Badge key={role} variant="secondary">
                                    {roleLabels[role]}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-2 h-4 w-4 p-0"
                                      onClick={() => removeRole(user.id, role)}
                                    >
                                      ×
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label>Adicionar Role</Label>
                              <div className="flex gap-2 mt-2">
                                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(roleLabels).map(([role, label]) => (
                                      <SelectItem key={role} value={role}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  onClick={() => {
                                    if (selectedRole) {
                                      assignRole(user.id, selectedRole)
                                      setSelectedRole('')
                                    }
                                  }}
                                  disabled={!selectedRole}
                                >
                                  Adicionar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}