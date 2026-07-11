import React from 'react';
import { Bot, Building2, Globe, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GabineteSettings: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Configurações</p>
        <h2 className="mt-1 text-3xl font-black text-slate-950">Painel do gabinete</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Ajustes essenciais da organização, equipe, canais e IA.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card icon={Building2} title="Organização" text={profile?.organization?.name || 'Gabinete'} />
        <Card icon={Users} title="Equipe" text="Controle assessores e permissões pelo Super Admin." />
        <Card icon={Bot} title="IA" text="Configure chaves e instruções do agente de triagem." />
        <Card icon={ShieldCheck} title="Segurança" text="Acesso isolado por organização e sessão protegida." />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 font-black text-slate-950">
          <Globe size={20} className="text-primary" /> Próximas configurações recomendadas
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {['Mensagem automática de boas-vindas', 'Categorias e prazos por secretaria', 'Domínio público de consulta de protocolo'].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
              {item}
            </div>
          ))}
        </div>
        <Link to="/gabinete/whatsapp" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-black text-white">
          Conectar WhatsApp
        </Link>
      </section>
    </div>
  );
};

const Card: React.FC<{ icon: React.ElementType; title: string; text: string }> = ({ icon: Icon, title, text }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon size={21} />
    </div>
    <h3 className="font-black text-slate-950">{title}</h3>
    <p className="mt-2 text-sm font-medium text-slate-500">{text}</p>
  </article>
);

export default GabineteSettings;
