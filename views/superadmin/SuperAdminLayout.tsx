import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldAlert,
  ToggleRight,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SuperAdminLayout: React.FC = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin' },
    { icon: BarChart3, label: 'Analytics', path: '/superadmin/analytics' },
    { icon: Activity, label: 'Monitoring', path: '/superadmin/monitoring' },
    { icon: Building2, label: 'Gabinetes', path: '/superadmin/tenants' },
    { icon: HelpCircle, label: 'Suporte', path: '/superadmin/support' },
    { icon: Users, label: 'Equipe', path: '/superadmin/team' },
    { icon: CreditCard, label: 'Planos', path: '/superadmin/plans' },
    { icon: DollarSign, label: 'Billing', path: '/superadmin/billing' },
    { icon: ToggleRight, label: 'Feature Flags', path: '/superadmin/feature-flags' },
    { icon: ScrollText, label: 'Audit Log', path: '/superadmin/audit-log' },
    { icon: Globe, label: 'Dominios', path: '/superadmin/domains' },
    { icon: Calendar, label: 'Consultoria', path: '/superadmin/consulting' },
  ];

  if (profile?.role !== 'superadmin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-red-50 p-4 text-red-800">
        <ShieldAlert size={64} className="mb-4" />
        <h1 className="mb-2 text-2xl font-bold">Acesso negado</h1>
        <p className="mb-6">Voce nao tem permissao de Super Admin.</p>
        <button
          onClick={() => navigate('/admin')}
          className="rounded bg-red-800 px-4 py-2 text-white hover:bg-red-900"
        >
          Voltar para o painel
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-200 ease-in-out md:static ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 p-6">
            <div className="flex items-center gap-2 text-xl font-bold text-red-500">
              <ShieldAlert />
              <span>Super Admin</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white md:hidden"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/superadmin'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={20} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{profile?.full_name}</p>
                <p className="truncate text-xs text-slate-400">{profile?.email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-slate-800 hover:text-red-400"
            >
              <LogOut size={18} />
              Sair do sistema
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 md:hidden">
          <div className="font-bold text-slate-800">Super Admin</div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
