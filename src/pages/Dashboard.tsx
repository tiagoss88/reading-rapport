import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle2, Smartphone, AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getServicosUrgentes } from '@/components/medicao-terceirizada/PainelUrgencias'

interface DashboardStats {
  empreendimentosTerceirizados: number
  coletasConfirmadas: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    empreendimentosTerceirizados: 0,
    coletasConfirmadas: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const empRes = await supabase.from('empreendimentos_terceirizados').select('id', { count: 'exact', head: true })
      const coletasRes = await supabase.from('servicos_nacional_gas').select('id', { count: 'exact', head: true }).eq('status_atendimento', 'executado')

      setStats({
        empreendimentosTerceirizados: empRes.count || 0,
        coletasConfirmadas: coletasRes.count || 0
      })
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

  const { data: servicos } = useQuery({
    queryKey: ['servicos-nacional-gas-urgentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_nacional_gas')
        .select('id, data_solicitacao, condominio_nome_original, bloco, apartamento, tipo_servico, status_atendimento, morador_nome')
        .in('status_atendimento', ['pendente', 'agendado'])
      if (error) throw error
      return data
    }
  })

  const urgentes = servicos ? getServicosUrgentes(servicos) : []
  const vencidos = urgentes.filter(u => u.nivel === 'vencido').length
  const criticos = urgentes.filter(u => u.nivel === 'critico').length
  const totalUrgentes = vencidos + criticos

  return (
    <Layout title="Dashboard">
      {/* Card de alertas urgentes */}
      {totalUrgentes > 0 && (
        <Card className="mb-6 border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/10 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/medicao-terceirizada/servicos')}>
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Serviços com prazo crítico</p>
              <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
            </div>
            <div className="flex gap-2">
              {vencidos > 0 && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {vencidos} vencido{vencidos > 1 ? 's' : ''}
                </Badge>
              )}
              {criticos > 0 && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  {criticos} crítico{criticos > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empreendimentos Terceirizados</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.empreendimentosTerceirizados}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de empreendimentos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coletas Confirmadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.coletasConfirmadas}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de coletas realizadas
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
    </Layout>
  )
}
