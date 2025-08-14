import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, FileText, Activity, Smartphone } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  empreendimentos: number
  clientes: number
  leiturasHoje: number
  totalLeituras: number
}

interface LeituraRecente {
  id: string
  leitura_atual: number
  data_leitura: string
  status_sincronizacao: string
  clientes?: {
    identificacao_unidade: string
    empreendimentos?: {
      nome: string
    }
  }
  operadores?: {
    nome: string
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    empreendimentos: 0,
    clientes: 0,
    leiturasHoje: 0,
    totalLeituras: 0
  })
  const [leiturasRecentes, setLeiturasRecentes] = useState<LeituraRecente[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Buscar estatísticas
      const [empreendimentosRes, clientesRes, leiturasRes] = await Promise.all([
        supabase.from('empreendimentos').select('*', { count: 'exact', head: true }),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('leituras').select('*', { count: 'exact', head: true })
      ])

      // Buscar leituras de hoje
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)

      const { count: leiturasHojeCount } = await supabase
        .from('leituras')
        .select('*', { count: 'exact', head: true })
        .gte('data_leitura', hoje.toISOString())
        .lt('data_leitura', amanha.toISOString())

      // Buscar leituras recentes
      const { data: leituras, error: leiturasError } = await supabase
        .from('leituras')
        .select(`
          *,
          clientes:cliente_id (
            identificacao_unidade,
            empreendimentos:empreendimento_id (nome)
          ),
          operadores:operador_id (nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (leiturasError) throw leiturasError

      setStats({
        empreendimentos: empreendimentosRes.count || 0,
        clientes: clientesRes.count || 0,
        leiturasHoje: leiturasHojeCount || 0,
        totalLeituras: leiturasRes.count || 0
      })

      setLeiturasRecentes(leituras || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados do dashboard",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sincronizado':
        return <Badge variant="default">Sincronizado</Badge>
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Layout title="Dashboard">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empreendimentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.empreendimentos}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de condomínios cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.clientes}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de unidades cadastradas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leituras Hoje</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.leiturasHoje}
            </div>
            <p className="text-xs text-muted-foreground">
              Leituras realizadas hoje
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leituras</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalLeituras}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de leituras no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card do Coletor Mobile */}
      <div className="mt-6">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-primary" />
                  Coletor Mobile
                </CardTitle>
                <CardDescription>
                  Acesse o app móvel para realizar leituras em campo
                </CardDescription>
              </div>
              <Button 
                onClick={() => navigate('/coletor-sync')}
                className="flex items-center"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Abrir Coletor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O coletor permite sincronizar dados, selecionar empreendimentos e registrar leituras diretamente no campo, 
              incluindo captura de fotos dos medidores.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Leituras Recentes</CardTitle>
            <CardDescription>
              Últimas leituras realizadas pelos operadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando leituras...</p>
              </div>
            ) : leiturasRecentes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma leitura encontrada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Leitura</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leiturasRecentes.map((leitura) => (
                    <TableRow key={leitura.id}>
                      <TableCell className="font-medium">
                        {format(new Date(leitura.data_leitura), 'dd/MM HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {leitura.clientes?.empreendimentos?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {leitura.clientes?.identificacao_unidade || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {leitura.leitura_atual.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {leitura.operadores?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(leitura.status_sincronizacao)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}