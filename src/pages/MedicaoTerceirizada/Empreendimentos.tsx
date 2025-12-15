import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Search, Building2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import EmpreendimentoTerceirizadoDialog from '@/components/medicao-terceirizada/EmpreendimentoTerceirizadoDialog'
import ImportarEmpreendimentosDialog from '@/components/medicao-terceirizada/ImportarEmpreendimentosDialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface EmpreendimentoTerceirizado {
  id: string
  nome: string
  endereco: string
  uf: string
  quantidade_medidores: number
  rota: number
  created_at: string
}

export default function EmpreendimentosTerceirizados() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editingEmpreendimento, setEditingEmpreendimento] = useState<EmpreendimentoTerceirizado | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ufFilter, setUfFilter] = useState<string>('all')
  const [rotaFilter, setRotaFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: empreendimentos, isLoading } = useQuery({
    queryKey: ['empreendimentos-terceirizados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos_terceirizados')
        .select('*')
        .order('rota', { ascending: true })
        .order('nome', { ascending: true })
      
      if (error) throw error
      return data as EmpreendimentoTerceirizado[]
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empreendimentos_terceirizados')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-terceirizados'] })
      toast({ title: 'Empreendimento excluído com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao excluir empreendimento', variant: 'destructive' })
    }
  })

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('empreendimentos_terceirizados')
        .delete()
        .in('id', ids)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos-terceirizados'] })
      setSelectedIds(new Set())
      toast({ title: 'Empreendimentos excluídos com sucesso' })
    },
    onError: () => {
      toast({ title: 'Erro ao excluir empreendimentos', variant: 'destructive' })
    }
  })

  const toggleSelectAll = () => {
    if (!filteredEmpreendimentos) return
    if (selectedIds.size === filteredEmpreendimentos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredEmpreendimentos.map(e => e.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const rotas = empreendimentos 
    ? [...new Set(empreendimentos.map(e => e.rota))].sort((a, b) => a - b)
    : []

  const filteredEmpreendimentos = empreendimentos?.filter(emp => {
    const matchesSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.endereco.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUf = ufFilter === 'all' || emp.uf === ufFilter
    const matchesRota = rotaFilter === 'all' || emp.rota.toString() === rotaFilter
    
    return matchesSearch && matchesUf && matchesRota
  })

  const handleEdit = (empreendimento: EmpreendimentoTerceirizado) => {
    setEditingEmpreendimento(empreendimento)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingEmpreendimento(null)
    setDialogOpen(true)
  }

  return (
    <Layout title="Cadastro de Empreendimentos Terceirizados">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empreendimentos Terceirizados
            </CardTitle>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir {selectedIds.size} selecionado(s)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Empreendimentos</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir {selectedIds.size} empreendimento(s)? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMultipleMutation.mutate(Array.from(selectedIds))}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Empreendimento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={ufFilter} onValueChange={setUfFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas UFs</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rotaFilter} onValueChange={setRotaFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Rota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Rotas</SelectItem>
                  {rotas.map(rota => (
                    <SelectItem key={rota} value={rota.toString()}>
                      Rota {rota.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={filteredEmpreendimentos && filteredEmpreendimentos.length > 0 && selectedIds.size === filteredEmpreendimentos.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead className="text-center">Medidores</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmpreendimentos?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum empreendimento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmpreendimentos?.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(emp.id)}
                              onCheckedChange={() => toggleSelect(emp.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {emp.rota.toString().padStart(2, '0')}
                          </TableCell>
                          <TableCell>{emp.nome}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{emp.endereco}</TableCell>
                          <TableCell>{emp.uf}</TableCell>
                          <TableCell className="text-center">{emp.quantidade_medidores}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Empreendimento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir "{emp.nome}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(emp.id)}>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EmpreendimentoTerceirizadoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        empreendimento={editingEmpreendimento}
      />

      <ImportarEmpreendimentosDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </Layout>
  )
}
