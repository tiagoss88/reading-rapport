import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle2, Smartphone } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

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
      const coletasRes = await (supabase.from('servicos_nacional_gas') as any).select('id', { count: 'exact', head: true }).eq('status', 'executado')

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

  return (
    <Layout title="Dashboard">
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
