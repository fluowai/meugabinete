import { logger } from '@/utils/logger';
import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AlertCircle, Building2, Users, LayoutGrid, MessageSquare, Mail, Bot, BarChart3, Megaphone, Scale, UserCog, Brain, AlertTriangle, Map, FileText, Settings, Vote } from 'lucide-react';
import { Toaster } from 'sonner';

import GabineteLayout from './components/GabineteLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ImpersonationBanner from './components/ImpersonationBanner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './services/supabase';

import Login from './views/Login';
import Onboarding from './views/Onboarding';

const Register = lazy(() => import('./views/Register'));
const GabineteDashboard = lazy(() => import('./views/GabineteDashboard'));
const GabineteKanban = lazy(() => import('./views/GabineteKanban'));
const GabineteReports = lazy(() => import('./views/GabineteReports'));
const GabineteAI = lazy(() => import('./views/GabineteAI'));
const GabineteSettings = lazy(() => import('./views/GabineteSettings'));
const CRMLeads = lazy(() => import('./views/CRM/CRMLeads'));
const WhatsAppDashboard = lazy(() => import('./views/WhatsApp/WhatsAppDashboard'));
const EmailCenter = lazy(() => import('./views/EmailCenter'));
const ImpersonateCallback = lazy(() => import('./views/ImpersonateCallback'));

const SuperAdminLayout = lazy(() => import('./views/superadmin/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('./views/superadmin/Dashboard'));
const TenantManager = lazy(() => import('./views/superadmin/TenantManager'));
const PlanManager = lazy(() => import('./views/superadmin/PlanManager'));
const FeatureFlags = lazy(() => import('./views/superadmin/FeatureFlags'));
const AuditLog = lazy(() => import('./views/superadmin/AuditLog'));
const TeamManager = lazy(() => import('./views/superadmin/TeamManager'));
const AnalyticsDashboard = lazy(() => import('./views/superadmin/AnalyticsDashboard'));

// ── Placeholder para módulos em construção ──────────────────────────────────
interface PlaceholderProps {
  title: string;
  icon: string;
  description: string;
}

const PlaceholderModule: React.FC<PlaceholderProps> = ({ title, icon, description }) => (
  <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Módulo</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 max-w-xl mx-auto text-sm font-medium text-slate-500">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-sm font-bold text-amber-700">
        <AlertTriangle size={16} />
        Em construção — disponível em breve
      </div>
    </section>
  </div>
);

// ── Módulos lazy (placeholder) ──────────────────────────────────────────────
const MandatoView = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Gestão do Mandato" icon="🏛️" description="Agenda, projetos, indicações, moções,requerimentos, obras e fiscalização do mandato legislativo." /> }));
const CampanhaView = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Gestão de Campanha" icon="🗳️" description="CRM eleitoral, cabos eleitorais, coordenadores, voluntários, metas e mapa de visitas." /> }));
const BIPolitico = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="BI Político" icon="📊" description="Dashboards em tempo real: atendimento, mandato, campanha, eleitoral, marketing, financeiro e indicadores." /> }));
const MarketingPolitico = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Marketing Político" icon="📣" description="Calendário editorial, gerador de posts, legendas, vídeos, discursos e pautas por IA." /> }));
const CentralLegislativa = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Central Legislativa" icon="⚖️" description="Assistente para elaboração de projetos de lei, indicações, moções, ofícios e requerimentos." /> }));
const GestaoEquipe = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Gestão de Equipe" icon="👥" description="Assessores, secretários, coordenadores, permissões, metas, produtividade e comunicação interna." /> }));
const InteligenciaEleitoral = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Inteligência Eleitoral" icon="🧠" description="Importação TSE, mapas de calor, comparativos históricos, análise por seção eleitoral." /> }));
const GestaoCrises = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Gestão de Crises" icon="🚨" description="Detecção automática de crises, índice de risco, plano de resposta e monitoramento." /> }));
const MapaPolitico = lazy(() => Promise.resolve({ default: () => <PlaceholderModule title="Mapa Político" icon="🗺️" description="Mapa inteligente: bairros, lideranças, demandas, obras, votação, eventos e sentimento." /> }));

// ── Error Boundary ──────────────────────────────────────────────────────────
interface EBProps { children: React.ReactNode; }
interface EBState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<EBProps, EBState> {
  declare props: EBProps;
  state: EBState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { logger.error('[ErrorBoundary]', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-8 text-center">
          <div className="card-premium p-10 max-w-2xl w-full">
            <div className="mb-6 inline-flex p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h1 className="h1 text-text-primary mb-4 uppercase tracking-tight">Ops! Algo deu errado.</h1>
            <p className="body text-text-secondary mb-8">Ocorreu um erro inesperado na renderização do sistema.</p>
            <div className="bg-bg-hover text-left p-6 rounded-xl mb-8 overflow-auto max-h-48 border border-border">
              <code className="text-accent text-xs font-mono">{this.state.error?.toString()}</code>
            </div>
            <button onClick={() => window.location.reload()} className="btn btn-primary btn-lg px-8">Recarregar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const FullScreenSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg-primary">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <p className="mt-4 text-text-secondary font-medium tracking-wide">Carregando...</p>
    </div>
  </div>
);

// ── Guards ──────────────────────────────────────────────────────────────────
const AuthRedirect: React.FC = () => {
  const { profile, isImpersonating, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (profile?.role === 'superadmin' && !isImpersonating) return <Navigate to="/superadmin" replace />;
  if (!profile?.organization_id && profile?.role !== 'superadmin') return <Navigate to="/onboarding" replace />;
  return <Navigate to="/gabinete" replace />;
};

const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isImpersonating, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenSpinner />;
  if (profile?.role === 'superadmin' && !isImpersonating) {
    const publicPaths = ['/', '/login', '/register', '/impersonate', '/onboarding'];
    const isPublicPath = publicPaths.some((p) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p));
    if (!isPublicPath && !location.pathname.startsWith('/superadmin')) {
      return <Navigate to="/superadmin" replace />;
    }
  }
  return <>{children}</>;
};

const SubscriptionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();
  const [plans, setPlans] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    supabase.from('plans').select('*').eq('is_active', true).order('price_monthly', { ascending: true }).then(({ data }) => setPlans(data || []));
  }, []);

  if (loading) return <FullScreenSpinner />;
  if (!profile?.organization || profile.role === 'superadmin') return <>{children}</>;

  const org: any = profile.organization;
  const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const expiredTrial = org.subscription_status === 'trial' && trialEndsAt && trialEndsAt.getTime() < Date.now();
  const missingPlan = !org.plan_id && org.subscription_status !== 'active';
  const mustChoosePlan = expiredTrial || missingPlan || org.subscription_status === 'payment_required';
  if (!mustChoosePlan) return <>{children}</>;

  const selectPlan = async (planId: string) => {
    setSaving(true);
    await supabase.from('organizations').update({ plan_id: planId, subscription_status: 'active', selected_plan_at: new Date().toISOString() }).eq('id', org.id);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-950">Seu teste gratuito terminou</h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">Escolha um plano para continuar acessando a plataforma.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.filter((plan) => (plan.slug || '').toLowerCase() !== 'free').map((plan) => (
            <button key={plan.id} type="button" disabled={saving} onClick={() => selectPlan(plan.id)} className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:shadow-lg disabled:opacity-60">
              <p className="text-lg font-black text-slate-950">{plan.name}</p>
              <p className="mt-1 text-3xl font-black text-blue-600">R$ {Number(plan.price_monthly || 0).toLocaleString('pt-BR')}<span className="text-xs font-bold text-slate-400">/mês</span></p>
              <p className="mt-3 text-sm font-semibold text-slate-500">Selecionar plano e continuar</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── App Content ─────────────────────────────────────────────────────────────
const AppContent: React.FC = () => {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Toaster richColors closeButton position="top-right" />
      <ImpersonationBanner />
      <SuperAdminGuard>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/impersonate" element={<ImpersonateCallback />} />

          <Route path="/admin" element={<ProtectedRoute><AuthRedirect /></ProtectedRoute>} />
          <Route path="/rural/*" element={<Navigate to="/gabinete" replace />} />
          <Route path="/urban/*" element={<Navigate to="/gabinete" replace />} />

          <Route path="/gabinete" element={<ProtectedRoute><SubscriptionGuard><GabineteLayout /></SubscriptionGuard></ProtectedRoute>}>
            <Route index element={<GabineteDashboard />} />
            <Route path="cidadaos" element={<CRMLeads />} />
            <Route path="demandas" element={<GabineteKanban />} />
            <Route path="whatsapp" element={<WhatsAppDashboard />} />
            <Route path="email" element={<EmailCenter />} />
            <Route path="ia" element={<GabineteAI />} />
            <Route path="mandato" element={<MandatoView />} />
            <Route path="campanha" element={<CampanhaView />} />
            <Route path="bi" element={<BIPolitico />} />
            <Route path="marketing" element={<MarketingPolitico />} />
            <Route path="legislativo" element={<CentralLegislativa />} />
            <Route path="equipe" element={<GestaoEquipe />} />
            <Route path="inteligencia" element={<InteligenciaEleitoral />} />
            <Route path="crise" element={<GestaoCrises />} />
            <Route path="mapa" element={<MapaPolitico />} />
            <Route path="relatorios" element={<GabineteReports />} />
            <Route path="configuracoes" element={<GabineteSettings />} />
          </Route>

          <Route path="/superadmin" element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="tenants" element={<TenantManager />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="monitoring" element={<PlaceholderModule title="Monitoramento" icon="📈" description="Saude do ambiente, filas, jobs, WhatsApp e disponibilidade da plataforma." />} />
            <Route path="support" element={<PlaceholderModule title="Suporte" icon="🎧" description="Fila de chamados, solicitacoes de clientes e acompanhamento de atendimento." />} />
            <Route path="billing" element={<PlaceholderModule title="Billing" icon="💳" description="Assinaturas, cobranca, inadimplencia e historico financeiro dos gabinetes." />} />
            <Route path="domains" element={<PlaceholderModule title="Dominios" icon="🌐" description="Configuracao e verificacao de dominios da plataforma." />} />
            <Route path="consulting" element={<PlaceholderModule title="Consultoria" icon="🗓️" description="Leads de consultoria, reunioes e implantacao assistida." />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="features" element={<FeatureFlags />} />
            <Route path="feature-flags" element={<FeatureFlags />} />
            <Route path="plans" element={<PlanManager />} />
            <Route path="team" element={<TeamManager />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SuperAdminGuard>
    </Suspense>
  );
};

// ── App Root ────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <ErrorBoundary>
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  </ErrorBoundary>
);

export default App;
