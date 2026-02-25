import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Dashboard from '@/pages/Dashboard'
import Operadores from '@/pages/Operadores'
import CriarServico from '@/pages/CriarServico'
import CriarServicoExterno from '@/pages/CriarServicoExterno'
import Agendamentos from '@/pages/Agendamentos'
import OperadorApp from '@/pages/OperadorApp'
import PermissionsManagement from '@/pages/PermissionsManagement'
import RastreamentoOperadores from '@/pages/RastreamentoOperadores'
import Relatorios from '@/pages/Relatorios'
import TiposServico from '@/pages/TiposServico'
import ConfiguracoesSistema from '@/pages/ConfiguracoesSistema'
import EmpreendimentosTerceirizados from '@/pages/MedicaoTerceirizada/Empreendimentos'
import PlanejamentoRotas from '@/pages/MedicaoTerceirizada/PlanejamentoRotas'
import ServicosNacionalGas from '@/pages/MedicaoTerceirizada/Servicos'
import GeorreferenciamentoTerceirizado from '@/pages/MedicaoTerceirizada/Georreferenciamento'
import LeiturasTerceirizadas from '@/pages/MedicaoTerceirizada/Leituras'
import PermissionRoute from '@/components/PermissionRoute'
import ColetorLogin from '@/pages/ColetorLogin'
import ColetorMenu from '@/pages/ColetorMenu'
import ColetorLeiturasTerceirizadas from '@/pages/ColetorLeiturasTerceirizadas'
import ColetorEmpreendimentoDetalhe from '@/pages/ColetorEmpreendimentoDetalhe'
import ColetorUnidades from '@/pages/ColetorUnidades'
import ColetorLeitura from '@/pages/ColetorLeitura'

import ColetorServicosTerceirizados from '@/pages/ColetorServicosTerceirizados'
import EmpreendimentoLogin from '@/pages/EmpreendimentoLogin'
import AreaCliente from '@/pages/AreaCliente'
import ProtectedRoute from '@/components/ProtectedRoute'
import ColetorProtectedRoute from '@/components/ColetorProtectedRoute'
import NotFound from "./pages/NotFound";
import NotAuthorized from '@/pages/NotAuthorized'
import AdminAtualizarRotasCE from '@/pages/AdminAtualizarRotasCE'

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PermissionsProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/empreendimento/login" element={<EmpreendimentoLogin />} />
                <Route path="/area-cliente" element={<AreaCliente />} />
                <Route path="/operador" element={<OperadorApp />} />
                <Route path="/coletor/login" element={<ColetorLogin />} />
                <Route path="/coletor" element={
                  <ColetorProtectedRoute>
                    <ColetorMenu />
                  </ColetorProtectedRoute>
                } />
                <Route path="/coletor-sync" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_leituras">
                      <ColetorLeiturasTerceirizadas />
                    </PermissionRoute>
                  </ColetorProtectedRoute>
                } />
                <Route path="/coletor/unidades/:empreendimentoId" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_leituras">
                      <ColetorUnidades />
                    </PermissionRoute>
                  </ColetorProtectedRoute>
                } />
                <Route path="/coletor/leitura/:clienteId" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_leituras">
                      <ColetorLeitura />
                    </PermissionRoute>
                  </ColetorProtectedRoute>
                } />
                <Route path="/coletor/servicos-terceirizados" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_servicos">
                      <ColetorServicosTerceirizados />
                    </PermissionRoute>
                  </ColetorProtectedRoute>
                } />
                <Route path="/coletor/empreendimento/:empreendimentoId" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_leituras">
                      <ColetorEmpreendimentoDetalhe />
                    </PermissionRoute>
                  </ColetorProtectedRoute>
                } />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="view_dashboard" redirectTo="/not-authorized">
                      <Dashboard />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/operadores" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="manage_operadores">
                      <Operadores />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/servicos/criar" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="create_servicos">
                      <CriarServico />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/servicos/criar-externo" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="create_servicos_externos">
                      <CriarServicoExterno />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/servicos/agendamentos" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="manage_agendamentos">
                      <Agendamentos />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/permissions" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <PermissionsManagement />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/rastreamento" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="view_rastreamento_operadores" redirectTo="/not-authorized">
                      <RastreamentoOperadores />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/relatorios" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="view_relatorios" redirectTo="/not-authorized">
                      <Relatorios />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/configuracoes/tipos-servico" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="manage_operadores">
                      <TiposServico />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/configuracoes/sistema" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <ConfiguracoesSistema />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/medicao-terceirizada/empreendimentos" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <EmpreendimentosTerceirizados />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/medicao-terceirizada/rotas" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <PlanejamentoRotas />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/medicao-terceirizada/servicos" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <ServicosNacionalGas />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/medicao-terceirizada/georreferenciamento" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <GeorreferenciamentoTerceirizado />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/medicao-terceirizada/leituras" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <LeiturasTerceirizadas />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/admin/atualizar-rotas-ce" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <AdminAtualizarRotasCE />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/not-authorized" element={<NotAuthorized />} />
              </Routes>
              <Toaster />
            </div>
          </BrowserRouter>
        </PermissionsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
