import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { AlertTriangle, Bug, Download, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LogErro {
  id: string
  created_at: string
  user_id: string | null
  user_email: string | null
  rota: string | null
  severidade: string
  mensagem: string
  detalhes: string | null
  user_agent: string | null
  contexto: unknown
}

const LogsErro = () => {
  const queryClient = useQueryClient()
  const [severidade, setSeveridade] = useState('todas')
  const [periodo, setPeriodo] = useState('7')
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState('50')
  const [selecionado, setSelecionado] = useState<LogErro | null>(null)

  const { data: logs, isLoading, isFetching } = useQuery({
    queryKey: ['logs-erro', severidade, periodo, busca, limite],
    queryFn: async () => {
      let query = supabase
        .from('logs_erro')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Number(limite))

      if (severidade !== 'todas') query = query.eq('severidade', severidade)

      if (periodo !== 'todos') {
        const desde = new Date()
        desde.setDate(desde.getDate() - Number(periodo))
        query = query.gte('created_at', desde.toISOString())
      }

      if (busca.trim()) {
        const termo = `%${busca.trim()}%`
        query = query.or(`mensagem.ilike.${termo},rota.ilike.${termo},user_email.ilike.${termo}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as LogErro[]
    },
  })

  const limparMutation = useMutation({
    mutationFn: async (dias: number) => {
      const limite = new Date()
      limite.setDate(limite.getDate() - dias)
      const { error } = await supabase.from('logs_erro').delete().lt('created_at', limite.toISOString())
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs-erro'] })
      toast.success('Registros antigos removidos')
    },
    onError: () => toast.error('Erro ao limpar registros'),
  })

  const exportarCSV = () => {
    if (!logs?.length) {
      toast.error('Nenhum registro para exportar')
      return
    }
    const cabecalho = ['Data', 'Severidade', 'Usuário', 'Rota', 'Mensagem', 'Detalhes', 'Navegador']
    const linhas = logs.map((l) => [
      format(new Date(l.created_at), 'dd/MM/yyyy HH:mm:ss'),
      l.severidade,
      l.user_email ?? '',
      l.rota ?? '',
      l.mensagem,
      (l.detalhes ?? '').replace(/\s+/g, ' '),
      l.user_agent ?? '',
    ])
    const csv = [cabecalho, ...linhas]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-erro-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Log de Erros">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Log de Erros do Sistema
          </CardTitle>
          <CardDescription>
            Registros de falhas capturadas automaticamente no aplicativo. Use para investigar problemas relatados pelos usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-1 block">Buscar</Label>
              <Input
                placeholder="Mensagem, rota ou e-mail"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="w-36">
              <Label className="text-xs mb-1 block">Severidade</Label>
              <Select value={severidade} onValueChange={setSeveridade}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label className="text-xs mb-1 block">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Últimas 24h</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-28">
              <Label className="text-xs mb-1 block">Limite</Label>
              <Select value={limite} onValueChange={setLimite}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['25', '50', '100'].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['logs-erro'] })}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" className="h-9" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-9" disabled={limparMutation.isPending}>
                  {limparMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Limpar antigos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover registros com mais de 30 dias?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os registros mais antigos que 30 dias serão excluídos permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => limparMutation.mutate(30)}>
                    Sim, limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !logs?.length ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              <AlertTriangle className="h-6 w-6" />
              Nenhum erro registrado no período selecionado.
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-9 whitespace-nowrap">Data</TableHead>
                    <TableHead className="h-9">Tipo</TableHead>
                    <TableHead className="h-9">Usuário</TableHead>
                    <TableHead className="h-9">Rota</TableHead>
                    <TableHead className="h-9">Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelecionado(log)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.severidade === 'error' ? 'destructive' : 'secondary'}>
                          {log.severidade === 'error' ? 'Erro' : 'Aviso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{log.user_email ?? '—'}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{log.rota ?? '—'}</TableCell>
                      <TableCell className="max-w-[420px] truncate">{log.mensagem}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selecionado} onOpenChange={(o) => !o && setSelecionado(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do erro</DialogTitle>
            <DialogDescription>
              {selecionado && format(new Date(selecionado.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          {selecionado && (
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Mensagem</Label>
                <p className="font-medium break-words">{selecionado.mensagem}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Usuário</Label>
                  <p>{selecionado.user_email ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rota</Label>
                  <p className="break-words">{selecionado.rota ?? '—'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Navegador</Label>
                <p className="text-xs break-words">{selecionado.user_agent ?? '—'}</p>
              </div>
              {selecionado.detalhes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Detalhes técnicos</Label>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                    {selecionado.detalhes}
                  </pre>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Contexto</Label>
                <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selecionado.contexto ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default LogsErro
