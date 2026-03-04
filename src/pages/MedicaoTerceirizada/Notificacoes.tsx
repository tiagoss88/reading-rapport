import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bell, Plus, CalendarIcon, Camera, ImagePlus, X, Search, Eye, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { smartCompress } from '@/lib/imageCompression'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface FotoItem {
  file: File
  preview: string
}

export default function NotificacoesMedidores() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNotificacao, setSelectedNotificacao] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [dataNotificacao, setDataNotificacao] = useState<Date>(new Date())
  const [condominioNome, setCondominioNome] = useState('')
  const [bloco, setBloco] = useState('')
  const [unidade, setUnidade] = useState('')
  const [observacao, setObservacao] = useState('')
  const [fotos, setFotos] = useState<FotoItem[]>([])
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['notificacoes-medidores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes_medidores')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notificacoes_medidores').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-medidores'] })
      toast({ title: 'Notificação excluída' })
      setDeleteDialogOpen(false)
    }
  })

  const searchEmpreendimentos = async (term: string) => {
    if (term.length < 2) { setSuggestions([]); return }
    const { data } = await supabase
      .from('empreendimentos_terceirizados')
      .select('id, nome')
      .ilike('nome', `%${term}%`)
      .limit(5)
    setSuggestions(data || [])
    setShowSuggestions(true)
  }

  const handleFotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      try {
        const compressed = await smartCompress(file)
        setFotos(prev => [...prev, { file: compressed, preview: URL.createObjectURL(compressed) }])
      } catch {
        setFotos(prev => [...prev, { file, preview: URL.createObjectURL(file) }])
      }
    }
    e.target.value = ''
  }

  const removeFoto = (index: number) => {
    setFotos(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    setDataNotificacao(new Date())
    setCondominioNome('')
    setBloco('')
    setUnidade('')
    setObservacao('')
    fotos.forEach(f => URL.revokeObjectURL(f.preview))
    setFotos([])
  }

  const handleSubmit = async () => {
    if (!condominioNome.trim() || !bloco.trim() || !unidade.trim()) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      // Upload fotos
      const fotoUrls: string[] = []
      for (const foto of fotos) {
        const fileName = `notificacoes/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        const { error: uploadError } = await supabase.storage.from('medidor-fotos').upload(fileName, foto.file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('medidor-fotos').getPublicUrl(fileName)
        fotoUrls.push(urlData.publicUrl)
      }

      const { error } = await supabase.from('notificacoes_medidores').insert({
        data_notificacao: format(dataNotificacao, 'yyyy-MM-dd'),
        condominio_nome: condominioNome.trim(),
        bloco: bloco.trim(),
        unidade: unidade.trim(),
        fotos: fotoUrls,
        observacao: observacao.trim() || null,
        operador_id: user?.id
      })

      if (error) throw error

      toast({ title: 'Notificação registrada com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-medidores'] })
      resetForm()
      setDialogOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro ao registrar notificação', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const filtered = notificacoes?.filter(n =>
    n.condominio_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.bloco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.unidade.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Layout title="Notificações de Medidores">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Notificação
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notificações Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Condomínio</TableHead>
                    <TableHead>Bloco</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Fotos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map(n => (
                    <TableRow key={n.id}>
                      <TableCell>{n.data_notificacao ? format(new Date(n.data_notificacao + 'T12:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>{n.condominio_nome}</TableCell>
                      <TableCell>{n.bloco}</TableCell>
                      <TableCell>{n.unidade}</TableCell>
                      <TableCell>{n.fotos?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setSelectedNotificacao(n); setViewDialogOpen(true) }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { setDeletingId(n.id); setDeleteDialogOpen(true) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filtered || filtered.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma notificação encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nova Notificação Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data da Notificação *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataNotificacao && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataNotificacao ? format(dataNotificacao, 'dd/MM/yyyy') : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataNotificacao} onSelect={d => d && setDataNotificacao(d)} className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative">
              <label className="text-sm font-medium">Condomínio *</label>
              <Input
                value={condominioNome}
                onChange={e => { setCondominioNome(e.target.value); searchEmpreendimentos(e.target.value) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Digite o nome do condomínio"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted" onClick={() => { setCondominioNome(s.nome); setShowSuggestions(false) }}>
                      {s.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Bloco *</label>
                <Input value={bloco} onChange={e => setBloco(e.target.value)} placeholder="Ex: A" />
              </div>
              <div>
                <label className="text-sm font-medium">Unidade *</label>
                <Input value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: 101" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Observação</label>
              <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observações sobre a notificação..." rows={3} />
            </div>

            <div>
              <label className="text-sm font-medium">Fotos</label>
              <div className="flex gap-2 mt-1">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoCapture} />
                <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFotoCapture} />
                <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-1" /> Câmera
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-1" /> Galeria
                </Button>
              </div>
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {fotos.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={f.preview} alt="" className="w-full h-20 object-cover rounded" />
                      <button onClick={() => removeFoto(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Notificação</DialogTitle>
          </DialogHeader>
          {selectedNotificacao && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Data:</span> {selectedNotificacao.data_notificacao ? format(new Date(selectedNotificacao.data_notificacao + 'T12:00:00'), 'dd/MM/yyyy') : '-'}</div>
                <div><span className="font-medium">Condomínio:</span> {selectedNotificacao.condominio_nome}</div>
                <div><span className="font-medium">Bloco:</span> {selectedNotificacao.bloco}</div>
                <div><span className="font-medium">Unidade:</span> {selectedNotificacao.unidade}</div>
              </div>
              {selectedNotificacao.observacao && (
                <div className="text-sm"><span className="font-medium">Observação:</span> {selectedNotificacao.observacao}</div>
              )}
              {selectedNotificacao.fotos?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Fotos ({selectedNotificacao.fotos.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedNotificacao.fotos.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-32 object-cover rounded border" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir notificação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}
