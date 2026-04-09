import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedComponent from '@/components/ProtectedComponent'
import { Button } from '@/components/ui/button'
import { Calendar, FileCheck, Wrench, Bell, Power, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLocationTracking } from '@/hooks/useLocationTracking'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import ProfileDialog from '@/components/ProfileDialog'
import InstallAppBanner from '@/components/InstallAppBanner'


export default function ColetorMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  
  useLocationTracking(true)
  useRealtimeNotifications()

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

  const operadorNome = user?.user_metadata?.nome || user?.email || 'Operador'

  const getInitials = (name: string) => {
    return name
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('')
  }

  const menuItems = [
    { label: 'Cronograma de Leitura', icon: Calendar, path: '/coletor/cronograma', permission: 'coletor_leituras' as const },
    { label: 'Confirmação de Leitura', icon: FileCheck, path: '/coletor-sync', permission: 'coletor_leituras' as const },
    { label: 'Serviços', icon: Wrench, path: '/coletor/servicos-terceirizados', permission: 'coletor_servicos' as const },
    { label: 'Notificações', icon: Bell, path: '/coletor/notificacoes', permission: 'coletor_leituras' as const },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <InstallAppBanner />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-3">
          {/* Header */}
          <div className="bg-[#E7F1FF] px-6 py-5 flex items-center gap-4">
            <div className="w-[60px] h-[60px] rounded-full bg-[#007bff] flex items-center justify-center text-white text-xl font-bold shrink-0">
              {getInitials(operadorNome)}
            </div>
            <div className="min-w-0">
              <h2 className="text-[#003366] font-bold text-lg truncate">{operadorNome}</h2>
              <ProfileDialog triggerLabel="Ver perfil" triggerClassName="text-[#007bff] text-sm hover:underline bg-transparent border-none p-0 h-auto" />
            </div>
          </div>

          {/* Menu List */}
          <div className="p-[15px] space-y-[5px]">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <ProtectedComponent key={item.path} permission={item.permission}>
                  <div
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-3 px-4 py-[15px] rounded-lg cursor-pointer transition-colors
                      ${isActive
                        ? 'bg-[#E7F1FF] text-[#007bff] font-semibold'
                        : 'text-gray-600 hover:bg-[#f8f9fa] hover:text-[#007bff]'
                      }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#007bff]' : 'text-[#888]'}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                </ProtectedComponent>
              )
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 p-4 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F8D7DA] text-[#721C24] text-sm font-medium hover:bg-[#f5c6cb] transition-colors"
            >
              <Power className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">Sistema de Gestão de Leituras de Gás</p>
          <p className="text-xs text-gray-400 mt-1">v1.0 - Modo Coletor</p>
        </div>
      </div>

    </div>
  )
}
