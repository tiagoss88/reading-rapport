import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Search, AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import MaterialDialog, { MaterialForm } from './MaterialDialog'

export interface MaterialSaldo {
  id: string
  nome: string
  descricao: string | null
  unidade: string
  categoria: string | null
  estoque_minimo: number
  ativo: boolean
  saldo: number
}

interface Props {
  onChanged?: () => void
}

export default function MateriaisTab({ onChanged }: Props) {
  const { toast } = useToast()
  const [itens, setItens] = useState<MaterialSaldo[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [soCriticos, setSoCriticos] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<MaterialForm | null>(null)

  const fetchItens = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('materiais_saldo')
      .select('*')
      .order('nome')
    if (error) {
      toast({ title: 'Erro ao carregar materiais', description: error.message, variant: 'destructive' })
    } else {
      setItens((data || []).map((d: any) => ({ ...d, saldo: Number(d.saldo) || 0, estoque_minimo: Number(d.estoque_minimo) || 0 })))
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchItens() }, [fetchItens])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return itens.filter(i => {
      const matchTermo = !termo
        || i.nome.toLowerCase().includes(termo)
        || (i.categoria || '').toLowerCase().includes(termo)
      const critico = i.saldo <= i.estoque_minimo
      return matchTermo && (!soCriticos || critico)
    })
  }, [itens, busca, soCriticos])

  const toggleAtivo = async (item: MaterialSaldo) => {
    const { error } = await supabase.from('materiais').update({ ativo: !item.ativo }).eq('id', item.id)
    if (error) {
      toast({ title: 'Erro ao atualizar material', description: error.message, variant: 'destructive' })
      return
    }
    fetchItens()
    onChanged?.()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 h-9" placeholder="Buscar por nome ou categoria" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <Button variant={soCriticos ? 'default' : 'outline'} size="sm" onClick={() => setSoCriticos(v => !v)}>
            <AlertTriangle className="mr-2 h-4 w-4" />Abaixo do mínimo
          </Button>
        </div>
        <Button size="sm" onClick={() => { setEditando(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Novo material
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 text-xs">Material</TableHead>
                <TableHead className="h-9 text-xs">Categoria</TableHead>
                <TableHead className="h-9 text-xs">Unidade</TableHead>
                <TableHead className="h-9 text-xs text-right">Saldo</TableHead>
                <TableHead className="h-9 text-xs text-right">Mínimo</TableHead>
                <TableHead className="h-9 text-xs">Status</TableHead>
                <TableHead className="h-9 text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={7} className="text-xs text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!loading && filtrados.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-xs text-center py-6 text-muted-foreground">Nenhum material encontrado.</TableCell></TableRow>
              )}
              {filtrados.map(item => {
                const critico = item.saldo <= item.estoque_minimo
                return (
                  <TableRow key={item.id} className={critico ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-xs font-medium">
                      {item.nome}
                      {item.descricao && <div className="text-[11px] text-muted-foreground">{item.descricao}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{item.categoria || '—'}</TableCell>
                    <TableCell className="text-xs">{item.unidade}</TableCell>
                    <TableCell className={`text-xs text-right font-semibold ${critico ? 'text-destructive' : ''}`}>{item.saldo}</TableCell>
                    <TableCell className="text-xs text-right">{item.estoque_minimo}</TableCell>
                    <TableCell className="text-xs">
                      {!item.ativo
                        ? <Badge variant="secondary">Inativo</Badge>
                        : critico
                          ? <Badge variant="destructive">Crítico</Badge>
                          : <Badge variant="outline">Ok</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditando({
                          id: item.id,
                          nome: item.nome,
                          descricao: item.descricao || '',
                          unidade: item.unidade,
                          categoria: item.categoria || '',
                          estoque_minimo: item.estoque_minimo,
                          ativo: item.ativo,
                        })
                        setDialogOpen(true)
                      }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleAtivo(item)}>
                        {item.ativo ? 'Inativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={editando}
        onSaved={() => { fetchItens(); onChanged?.() }}
      />
    </div>
  )
}
