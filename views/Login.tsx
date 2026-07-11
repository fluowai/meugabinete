import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { signIn, user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (
      user &&
      !authLoading &&
      !profile?.organization_id &&
      profile?.role !== 'superadmin' &&
      isSuccess
    ) {
      setIsSuccess(false);
      setError(
        'Sua conta ainda nao esta vinculada a um gabinete. Fale com o administrador para liberar o acesso.'
      );
      setSubmitting(false);
    }
  }, [authLoading, isSuccess, profile?.organization_id, profile?.role, user]);

  if (user && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user && (profile?.organization_id || profile?.role === 'superadmin')) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(getLoginErrorMessage(err));
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: <LayoutDashboard className="h-5 w-5 text-blue-600" />,
      title: 'Gabinete 360',
      desc: 'Demandas, atendimentos, cidadaos e prestacao de contas em um so painel.',
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
      title: 'WhatsApp centralizado',
      desc: 'Conversas organizadas por protocolo, prioridade e responsavel.',
    },
    {
      icon: <Bot className="h-5 w-5 text-blue-600" />,
      title: 'IA de triagem',
      desc: 'Classificacao, resumo e encaminhamento para reduzir retrabalho.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
      title: 'Operacao segura',
      desc: 'Ambiente multi-tenant com controle de acesso por equipe.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between bg-slate-900 px-12 py-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-black">
              MG
            </div>
            <div>
              <p className="text-lg font-black">Meu Gabinete</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                SaaS publico
              </p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
              Gestao politica com atendimento real
            </p>
            <h1 className="text-5xl font-black leading-tight">
              Entre no painel que organiza o relacionamento com a populacao.
            </h1>
            <p className="mt-6 text-lg font-medium leading-8 text-slate-300">
              Centralize WhatsApp, demandas, equipe, IA e relatorios para transformar atendimento
              publico em processo acompanhavel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                  {feature.icon}
                </div>
                <p className="font-black">{feature.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <main className="flex items-center justify-center bg-slate-50 p-5 text-slate-950 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 font-black text-white">
                MG
              </div>
              <h2 className="text-2xl font-black">Meu Gabinete</h2>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-900/10 md:p-9">
              {isSuccess && (
                <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={22} />
                    <div>
                      <p className="font-black">Acesso autorizado</p>
                      <p className="text-sm font-medium">Redirecionando para o painel...</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-3xl font-black">Acessar painel</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Use suas credenciais para entrar no Meu Gabinete.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">E-mail</span>
                  <span className="relative block">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="voce@gabinete.gov.br"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                    Senha
                    <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
                      Esqueceu?
                    </Link>
                  </span>
                  <span className="relative block">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Sua senha"
                    />
                  </span>
                </label>

                {error && (
                  <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="animate-spin" size={22} /> : <>Entrar <ArrowRight size={20} /></>}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm font-medium text-slate-500">Ainda nao tem acesso?</p>
                <Link
                  to="/register"
                  className="mt-3 inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Criar conta
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs font-semibold text-slate-400">
              © {new Date().getFullYear()} Meu Gabinete. Todos os direitos reservados.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

function getLoginErrorMessage(err: any) {
  const message = String(err?.message || '').toLowerCase();
  const status = err?.status;

  if (status === 400 || message.includes('invalid login credentials')) {
    return 'E-mail ou senha invalidos. Se esta conta foi criada agora, confirme o convite ou atualize a senha de acesso.';
  }

  if (message.includes('email not confirmed')) {
    return 'E-mail ainda nao confirmado. Peca ao administrador para confirmar ou recriar o acesso.';
  }

  return err?.message || 'Erro ao realizar login. Verifique suas credenciais.';
}

export default Login;
