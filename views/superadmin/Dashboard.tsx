import { logger } from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { Activity, Building2, DollarSign, Server, Users } from 'lucide-react';
import { supabase } from '../../services/supabase';

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    serverStatus: 'Online',
  });
  const [loading, setLoading] = useState(true);
  const [isFresh, setIsFresh] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const { count: active } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const revenue = active ? active * 197 : 0;

      setStats({
        totalTenants: total || 0,
        activeTenants: active || 0,
        totalRevenue: revenue,
        serverStatus: 'Online',
      });
      setIsFresh((total || 0) === 0);
    } catch (error) {
      logger.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      title: 'Total de Gabinetes',
      value: stats.totalTenants,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: 'Assinaturas Ativas',
      value: stats.activeTenants,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Receita Mensal (est.)',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
    },
    {
      title: 'Status do Servidor',
      value: stats.serverStatus,
      icon: Server,
      color: 'bg-purple-500',
    },
  ];

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Visao geral</h1>
        {isFresh && (
          <div className="flex animate-pulse items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700">
            <Activity size={18} />
            <span className="text-sm font-bold">Inicio rapido ativo</span>
          </div>
        )}
      </div>

      {isFresh && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="max-w-2xl">
            <h2 className="mb-3 text-3xl font-black text-white">
              Bem-vindo ao painel do Meu Gabinete
            </h2>
            <p className="mb-6 text-lg text-blue-100">
              Configure os planos de assinatura e cadastre o primeiro gabinete para iniciar a operacao.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/superadmin/plans"
                className="rounded-xl bg-white px-6 py-3 font-bold text-blue-700 shadow-lg transition-all hover:bg-blue-50"
              >
                Configurar planos
              </a>
              <a
                href="/superadmin/tenants"
                className="rounded-xl border border-blue-400 bg-blue-500 px-6 py-3 font-bold text-white transition-all hover:bg-blue-400"
              >
                Cadastrar gabinete
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.title}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div>
                <p className="mb-1 text-sm font-medium text-gray-500">{mod.title}</p>
                <p className="text-2xl font-bold text-gray-900">{mod.value}</p>
              </div>
              <div className={`rounded-lg p-3 text-white shadow-lg shadow-gray-200 ${mod.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <Activity size={20} className="text-gray-400" />
            Atividade recente
          </h2>
          <div className="py-8 text-center text-gray-500">Nenhuma atividade recente registrada.</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Alertas do sistema</h2>
          <div className="py-8 text-center text-gray-500">Sistema operando normalmente.</div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
