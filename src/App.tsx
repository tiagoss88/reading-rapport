import { lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Dashboard from '@/pages/Dashboard'
const Operadores = lazy(() => import('@/pages/Operadores'))
const CriarServico = lazy(() => import('@/pages/CriarServico'))
const CriarServicoExterno = lazy(() => import('@/pages/CriarServicoExterno'))
const Agendamentos = lazy(() => import('@/pages/Agendamentos'))
const OperadorApp = lazy(() => import('@/pages/OperadorApp'))
const PermissionsManagement = lazy(() => import('@/pages/PermissionsManagement'))
const RastreamentoOperadores = lazy(() => import('@/pages/RastreamentoOperadores'))
const RelatoriosLeituras = lazy(() => import('@/pages/RelatoriosLeituras'))
const RelatoriosServicos = lazy(() => import('@/pages/RelatoriosServicos'))
const TiposServico = lazy(() => import('@/pages/TiposServico'))
const ConfiguracoesSistema = lazy(() => import('@/pages/ConfiguracoesSistema'))
const LogsErro = lazy(() => import('@/pages/LogsErro'))
const ConfiguracoesMCP = lazy(() => import('@/pages/ConfiguracoesMCP'))

const EmpreendimentosTerceirizados = lazy(() => import('@/pages/MedicaoTerceirizada/Empreendimentos'))
const PlanejamentoRotas = lazy(() => import('@/pages/MedicaoTerceirizada/PlanejamentoRotas'))
const ServicosNacionalGas = lazy(() => import('@/pages/MedicaoTerceirizada/Servicos'))
const GeorreferenciamentoTerceirizado = lazy(() => import('@/pages/MedicaoTerceirizada/Georreferenciamento'))
const LeiturasTerceirizadas = lazy(() => import('@/pages/MedicaoTerceirizada/Leituras'))
import PermissionRoute from '@/components/PermissionRoute'
import ColetorLogin from '@/pages/ColetorLogin'
import ColetorMenu from '@/pages/ColetorMenu'
const ColetorCronograma = lazy(() => import('@/pages/ColetorCronograma'))
const ColetorLeiturasTerceirizadas = lazy(() => import('@/pages/ColetorLeiturasTerceirizadas'))
const ColetorEmpreendimentoDetalhe = lazy(() => import('@/pages/ColetorEmpreendimentoDetalhe'))
const ColetorUnidades = lazy(() => import('@/pages/ColetorUnidades'))
const ColetorLeitura = lazy(() => import('@/pages/ColetorLeitura'))

const ColetorServicosTerceirizados = lazy(() => import('@/pages/ColetorServicosTerceirizados'))
const ColetorNotificacoes = lazy(() => import('@/pages/ColetorNotificacoes'))
const NotificacoesMedidores = lazy(() => import('@/pages/MedicaoTerceirizada/Notificacoes'))
const EmpreendimentoLogin = lazy(() => import('@/pages/EmpreendimentoLogin'))
const AreaCliente = lazy(() => import('@/pages/AreaCliente'))
import ProtectedRoute from '@/components/ProtectedRoute'
import ColetorProtectedRoute from '@/components/ColetorProtectedRoute'
const NotFound = lazy(() => import('./pages/NotFound'))
const NotAuthorized = lazy(() => import('@/pages/NotAuthorized'))
const AdminAtualizarRotasCE = lazy(() => import('@/pages/AdminAtualizarRotasCE'))
const AdminGerarSQLRotas = lazy(() => import('@/pages/AdminGerarSQLRotas'))
const LimparCache = lazy(() => import('@/pages/LimparCache'))
const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'))
import ErrorBoundary from '@/components/ErrorBoundary'

// Carregada só ao abrir a página: uma falha no Estoque nunca afeta o resto do sistema
const Estoque = lazy(() => import('@/pages/Operacao/Estoque'))
const RelatoriosEstoque = lazy(() => import('@/pages/RelatoriosEstoque'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

const PageLoader = () => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

const App = () => (
  <ErrorBoundary fullScreen>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PermissionsProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/operacao/estoque" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <ErrorBoundary area="o Estoque">
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                          <Estoque />
                        </Suspense>
                      </ErrorBoundary>
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/relatorios/estoque" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <ErrorBoundary area="os Relatórios de Estoque">
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                          <RelatoriosEstoque />
                        </Suspense>
                      </ErrorBoundary>
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
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
                <Route path="/coletor/cronograma" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_leituras">
                      <ColetorCronograma />
                    </PermissionRoute>
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
                <Route path="/coletor/notificacoes" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_leituras">
                      <ColetorNotificacoes />
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
                <Route path="/relatorios/leituras" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="view_relatorios" redirectTo="/not-authorized">
                      <RelatoriosLeituras />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/relatorios/servicos" element={
                  <ProtectedRoute>
                    <PermissionRoute permission="view_relatorios" redirectTo="/not-authorized">
                      <RelatoriosServicos />
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
                <Route path="/configuracoes/logs" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <LogsErro />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/configuracoes/mcp" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <ConfiguracoesMCP />
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
                <Route path="/medicao-terceirizada/notificacoes" element={
                  <ProtectedRoute>
                    <PermissionRoute role="admin">
                      <NotificacoesMedidores />
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
            <Route path="/admin/gerar-sql-rotas" element={
              <ProtectedRoute>
                <PermissionRoute role="admin">
                  <AdminGerarSQLRotas />
                </PermissionRoute>
                  </ProtectedRoute>
                } />
                <Route path="/coletor/leituras-terceirizadas" element={
                  <ColetorProtectedRoute>
                    <PermissionRoute permission="coletor_leituras">
                      <ColetorLeiturasTerceirizadas />
                    </PermissionRoute>
                  </ColetorProtectedRoute>
                } />
                <Route path="/limpar-cache" element={<LimparCache />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/not-authorized" element={<NotAuthorized />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              <Toaster />
            </div>
          </BrowserRouter>
        </PermissionsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
