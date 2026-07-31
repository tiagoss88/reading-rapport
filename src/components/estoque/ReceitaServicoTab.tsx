import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Receita {
  id: string
  tipo_servico: string
  quantidade: number
  material_id: string
  materiais: { nome: string; unidade: string } | null
}

interface Props {
  onChanged?: () => void
}

export default function ReceitaServicoTab({ onChanged }: Props) {
  const { toast } = useToast()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [materiais, setMateriais] = useState<{ id: string; nome: string; unidade: string }[]>([])
  const [tiposServico, setTiposServico] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [tipoServico, setTipoServico] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [recRes, matRes, tipoRes] = await Promise.all([
      supabase.from('tipo_servico_materiais').select('id, tipo_servico, quantidade, material_id, materiais(nome, unidade)').order('tipo_servico'),
      supabase.from('materiais').select('id, nome, unidade').eq('ativo', true).order('nome'),
      supabase.from('tipos_servico').select('nome').eq('status', 'ativo').order('nome'),
    ])
    if (recRes.error) {
      toast({ title: 'Erro ao carregar receitas', description: recRes.error.message, variant: 'destructive' })
    } else {
      setReceitas((recRes.data || []) as any)
    }
    if (!matRes.error) setMateriais(matRes.data || [])
    if (!tipoRes.error) setTiposServico((tipoRes.data || []).map((t: any) => t.nome))
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const grupos = useMemo(() => {
    const map = new Map<string, Receita[]>()
    receitas.forEach(r => {
      const arr = map.get(r.tipo_servico) || []
      arr.push(r)
      map.set(r.tipo_servico, arr)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [receitas])

  const adicionar = async () => {
    const qtd = parseFloat(quantidade.replace(',', '.'))
    if (!tipoServico.trim() || !materialId || !qtd || qtd <= 0) {
      toast({ title: 'Preencha tipo de serviço, material e quantidade', variant: 'destructive' })
      return
    }
    setSaving(true)
    const { error } = await supabase.from('tipo_servico_materiais').insert({
      tipo_servico: tipoServico.trim(),
      material_id: materialId,
      quantidade: qtd,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' })
      return
    }
    setMaterialId('')
    setQuantidade('1')
    fetchData()
    onChanged?.()
  }

  const remover = async (id: string) => {
    const { error } = await supabase.from('tipo_servico_materiais').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao remover item', description: error.message, variant: 'destructive' })
      return
    }
    fetchData()
    onChanged?.()
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Defina os materiais consumidos por cada tipo de serviço. Ao marcar um serviço como executado,
            o sistema dá baixa automática dessas quantidades no estoque.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs">Tipo de serviço</Label>
              <Input
                className="h-9 text-xs"
                list="tipos-servico-estoque"
                value={tipoServico}
                onChange={e => setTipoServico(e.target.value)}
                placeholder="Ex: religacao"
              />
              <datalist id="tipos-servico-estoque">
                {tiposServico.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Material</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {materiais.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantidade</Label>
              <div className="flex gap-2">
                <Input className="h-9 text-xs" inputMode="decimal" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
                <Button size="sm" onClick={adicionar} disabled={saving}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-xs text-muted-foreground">Carregando...</p>}
      {!loading && grupos.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma receita cadastrada ainda.</p>
      )}

      {grupos.map(([tipo, itens]) => (
        <Card key={tipo}>
          <CardContent className="p-0">
            <div className="px-4 py-2 border-b text-xs font-semibold uppercase">{tipo}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 text-xs">Material</TableHead>
                  <TableHead className="h-9 text-xs text-right">Quantidade</TableHead>
                  <TableHead className="h-9 text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{item.materiais?.nome || '—'}</TableCell>
                    <TableCell className="text-xs text-right">{Number(item.quantidade)} {item.materiais?.unidade || ''}</TableCell>
                    <TableCell className="text-xs text-right">
                      <Button variant="ghost" size="sm" onClick={() => remover(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
