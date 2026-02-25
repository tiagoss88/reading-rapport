import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedComponent from '@/components/ProtectedComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, LogOut, User, Building2, Calendar, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLocationTracking } from '@/hooks/useLocationTracking'
import ProfileDialog from '@/components/ProfileDialog'

export default function ColetorMenu() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  useLocationTracking(true)

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

  const goToCronograma = () => {
    navigate('/coletor/cronograma')
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
          <div className="flex items-center gap-1">
            <ProfileDialog />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>


        {/* Menu Options */}
        <div className="space-y-3">
          {/* Cronograma de Leitura */}
          <ProtectedComponent permission="coletor_leituras">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={goToCronograma}>
              <CardHeader className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold">Cronograma de Leitura</CardTitle>
                    <CardDescription className="text-xs">
                      Planejamento das rotas por UF
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
            </Card>
          </ProtectedComponent>

          {/* Leituras */}
          <ProtectedComponent permission="coletor_leituras">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={goToLeituras}>
              <CardHeader className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold">Confirmação de Leituras</CardTitle>
                    <CardDescription className="text-xs">
                      Upload dos comprovantes sem pendência
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
            </Card>
          </ProtectedComponent>

          {/* Serviços Terceirizados */}
          <ProtectedComponent permission="coletor_servicos">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={goToServicosTerceirizados}>
              <CardHeader className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold">Serviços</CardTitle>
                    <CardDescription className="text-xs">
                      Visualizar e executar serviços
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
            </Card>
          </ProtectedComponent>
        </div>


        {/* Footer Info */}
        <div className="text-center pt-4">
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