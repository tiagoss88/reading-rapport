import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedComponent from '@/components/ProtectedComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, LogOut, User, Gauge, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLocationTracking } from '@/hooks/useLocationTracking'

export default function ColetorMenu() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { isTracking, error } = useLocationTracking(true)

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      })
      navigate('/coletor/login')
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  const goToLeituras = () => {
    navigate('/coletor-sync')
  }

  const goToServicosTerceirizados = () => {
    navigate('/coletor/servicos-terceirizados')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Menu Principal</h1>
              <p className="text-sm text-gray-600">
                {user?.email || 'Operador'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>


        {/* Menu Options */}
        <div className="space-y-4">
          {/* Leituras */}
          <ProtectedComponent permission="coletor_leituras">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader 
                className="pb-3"
                onClick={goToLeituras}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Leituras</CardTitle>
                    <CardDescription>
                      Empreendimentos por UF e Rota
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-sm text-gray-600">
                  <Gauge className="w-4 h-4 mr-2" />
                  <span>Coleta de dados dos medidores</span>
                </div>
              </CardContent>
            </Card>
          </ProtectedComponent>

          {/* Serviços Terceirizados */}
          <ProtectedComponent permission="coletor_servicos">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader 
                className="pb-3"
                onClick={goToServicosTerceirizados}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Serviços Terceirizados</CardTitle>
                    <CardDescription>
                      Serviços agendados da Nacional Gás
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-sm text-gray-600">
                  <span>Visualizar e executar serviços de medição terceirizada</span>
                </div>
              </CardContent>
            </Card>
          </ProtectedComponent>
        </div>

        {/* Footer Info */}
        <div className="text-center pt-8">
          <p className="text-sm text-gray-500">
            Sistema de Gestão de Leituras de Gás
          </p>
          <p className="text-xs text-gray-400 mt-1">
            v1.0 - Modo Coletor
          </p>
        </div>
      </div>
    </div>
  )
}