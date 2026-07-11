import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { callApi } from '../src/lib/api';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    officeName: '',
    welcomeMessage: 'Ola! Sou o assistente do gabinete. Como posso ajudar?',
    teamEmails: ['', '', ''],
  });

  const update = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const updateTeamEmail = (index: number, value: string) => {
    const teamEmails = [...formData.teamEmails];
    teamEmails[index] = value;
    update('teamEmails', teamEmails);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.officeName) {
        setError('Preencha nome, e-mail, senha e nome do gabinete.');
        return;
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    if (step === 3) {
      setLoading(true);
      setError('');
      try {
        await callApi('/api/onboarding', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            agencyName: formData.officeName,
            profileType: 'traditional',
            plan: 'pro',
          }),
        });
        setStep(4);
      } catch (err: any) {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep((current) => current + 1);
  };

  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-950">Crie seu gabinete digital</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Configure a conta principal e o espaco da sua equipe.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Seu nome"
          icon={<User size={16} />}
          value={formData.name}
          onChange={(value) => update('name', value)}
          placeholder="Nome completo"
        />
        <Field
          label="E-mail"
          type="email"
          icon={<Mail size={16} />}
          value={formData.email}
          onChange={(value) => update('email', value)}
          placeholder="voce@gabinete.gov.br"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nome do gabinete"
          icon={<ClipboardList size={16} />}
          value={formData.officeName}
          onChange={(value) => update('officeName', value)}
          placeholder="Gabinete Popular"
        />
        <Field
          label="Senha"
          type="password"
          icon={<Lock size={16} />}
          value={formData.password}
          onChange={(value) => update('password', value)}
          placeholder="Minimo 6 caracteres"
        />
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <MessageSquare size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-950">Canais e triagem</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          O WhatsApp sera conectado dentro do painel, com QR Code seguro.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Bot className="text-blue-600" size={22} />
          <div>
            <p className="font-black text-slate-900">Mensagem inicial da IA</p>
            <p className="text-xs font-medium text-slate-500">Voce pode ajustar isso depois.</p>
          </div>
        </div>
        <textarea
          value={formData.welcomeMessage}
          onChange={(e) => update('welcomeMessage', e.target.value)}
          className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm font-semibold text-blue-800">
        O painel ja nasce com etapas de demanda, SLA, prioridade, relatorios e acompanhamento por responsavel.
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <Users size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-950">Convide sua equipe</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Adicione assessores, atendimento e coordenacao. Opcional por agora.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        {formData.teamEmails.map((email, index) => (
          <Field
            key={index}
            label={`Integrante ${index + 1}`}
            type="email"
            icon={<Mail size={16} />}
            value={email}
            onChange={(value) => updateTeamEmail(index, value)}
            placeholder="email@exemplo.com"
          />
        ))}
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-3xl font-black text-slate-950">Tudo pronto</h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
        Seu gabinete foi criado. Entre para configurar WhatsApp, equipe, categorias e fluxos de demanda.
      </p>
      <button
        onClick={() => navigate('/login')}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 font-black text-white hover:bg-slate-800"
      >
        Acessar painel <ArrowRight size={18} />
      </button>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-2xl">
        {step < 4 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Passo {step} de 3
              </span>
              <span className="text-xs font-black text-blue-600">
                {step === 1 && 'Conta'}
                {step === 2 && 'Atendimento'}
                {step === 3 && 'Equipe'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-2xl shadow-slate-900/5 md:p-10">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </AnimatePresence>

          {step < 4 && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                className={`px-5 py-3 font-black text-slate-500 transition hover:text-slate-900 ${
                  step === 1 ? 'pointer-events-none opacity-0' : ''
                }`}
              >
                Voltar
              </button>

              <button
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : step === 3 ? 'Concluir' : 'Avancar'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, icon, type = 'text' }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
    <span className="relative block">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        placeholder={placeholder}
      />
    </span>
  </label>
);

export default Onboarding;
