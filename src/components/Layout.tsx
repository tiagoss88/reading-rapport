import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedComponent from '@/components/ProtectedComponent'
import ProfileDialog from '@/components/ProfileDialog'
import { 
  Home, 
  Building2, 
  Users, 
  FileText, 
  UserCheck,
  LogOut,
  Menu,
  Wrench,
  ChevronDown,
  Settings,
  MapPin,
  BarChart3,
  Gauge,
  Shield
} from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
  title: string
}

export default function Layout({ children, title }: LayoutProps) {
  const { signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [servicosOpen, setServicosOpen] = useState(false)
  const [medicaoOpen, setMedicaoOpen] = useState(false)
  const [configuracoesOpen, setConfiguracoesOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, permission: 'view_dashboard' },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3, permission: 'view_relatorios' },
    { name: 'Rastreamento', href: '/rastreamento', icon: MapPin, permission: 'view_rastreamento_operadores' },
  ]

  const medicaoItems = [
    { name: 'Leituras', href: '/leituras', icon: FileText, permission: 'view_leituras' },
    { name: 'Empreendimentos', href: '/empreendimentos', icon: Building2, permission: 'manage_empreendimentos' },
    { name: 'Clientes', href: '/clientes', icon: Users, permission: 'manage_clientes' }
  ]

  const servicosItems = [
    { name: 'Criar Serviço', href: '/servicos/criar', permission: 'create_servicos' },
    { name: 'Criar Serviço Externo', href: '/servicos/criar-externo', permission: 'create_servicos' },
    { name: 'Agendamentos', href: '/servicos/agendamentos', permission: 'manage_agendamentos' }
  ]

  const configuracoesItems = [
    { name: 'Operadores', href: '/operadores', icon: UserCheck, permission: 'manage_operadores' },
    { name: 'Tipos de Serviço', href: '/configuracoes/tipos-servico', icon: Wrench, permission: 'manage_operadores' },
    { name: 'Permissões', href: '/permissions', icon: Shield, role: 'admin' }
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/124d1417-15e6-4436-a1b4-66550bac6e66.png" 
              alt="Agasen Logo" 
              className="h-8 w-auto object-contain"
            />
            <h1 className="text-lg font-semibold">Sistema de Leituras</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <nav className="mt-6 flex-1">
          <div className="space-y-1 px-3">
            {/* 1. Dashboard */}
            {navigation.slice(0, 1).map((item) => (
              <ProtectedComponent key={item.name} permission={item.permission as any}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              </ProtectedComponent>
            ))}
            
            {/* 2. Medição Dropdown */}
            <ProtectedComponent permissions={["view_leituras", "manage_empreendimentos", "manage_clientes"]}>
              <div className="space-y-1">
                <button
                  onClick={() => setMedicaoOpen(!medicaoOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <div className="flex items-center">
                    <Gauge className="mr-3 h-5 w-5 flex-shrink-0" />
                    Medição
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${medicaoOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {medicaoOpen && (
                  <div className="ml-8 space-y-1">
                    {medicaoItems.map((item) => (
                      <ProtectedComponent key={item.name} permission={item.permission as any}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          {item.name}
                        </NavLink>
                      </ProtectedComponent>
                    ))}
                  </div>
                )}
              </div>
            </ProtectedComponent>
            
            {/* 3. Ordem de Serviço Dropdown */}
            <ProtectedComponent permissions={["create_servicos", "manage_agendamentos"]}>
              <div className="space-y-1">
                <button
                  onClick={() => setServicosOpen(!servicosOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <div className="flex items-center">
                    <Wrench className="mr-3 h-5 w-5 flex-shrink-0" />
                    Ordem de Serviço
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${servicosOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {servicosOpen && (
                  <div className="ml-8 space-y-1">
                    {servicosItems.map((item) => (
                      <ProtectedComponent key={item.name} permission={item.permission as any}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            `block px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
                        >
                          {item.name}
                        </NavLink>
                      </ProtectedComponent>
                    ))}
                  </div>
                )}
              </div>
            </ProtectedComponent>
            
            {/* 4-5. Relatórios, Rastreamento */}
            {navigation.slice(1).map((item) => (
              <ProtectedComponent key={item.name} permission={item.permission as any}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              </ProtectedComponent>
            ))}
            
            {/* 6. Configurações Dropdown - Admin/Manage Operadores */}
            <ProtectedComponent permissions={["manage_operadores"]} roles={["admin"]}>
              <div className="space-y-1">
                <button
                  onClick={() => setConfiguracoesOpen(!configuracoesOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <div className="flex items-center">
                    <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                    Configurações
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${configuracoesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {configuracoesOpen && (
                  <div className="ml-8 space-y-1">
                    {configuracoesItems.map((item) => (
                      <ProtectedComponent 
                        key={item.name} 
                        permission={item.permission as any}
                        role={item.role as any}
                      >
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          {item.name}
                        </NavLink>
                      </ProtectedComponent>
                    ))}
                  </div>
                )}
              </div>
            </ProtectedComponent>
          </div>
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        <header className="bg-card border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-3"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <div className="flex items-center">
            <ProfileDialog />
          </div>
        </header>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}