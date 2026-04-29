import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  Mail, 
  Phone, 
  MoreVertical, 
  CheckCircle, 
  XCircle,
  Lock,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive';
  lastLogin?: string;
  department?: string;
}

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Paulo Silva', email: 'paulo@gabinete.gov', phone: '(11) 98888-7777', role: 'admin', status: 'active', lastLogin: '2026-04-29 10:30', department: 'Gabinete' },
  { id: '2', name: 'Ana Souza', email: 'ana@gabinete.gov', phone: '(11) 97777-6666', role: 'manager', status: 'active', lastLogin: '2026-04-28 15:45', department: 'Comunicação' },
  { id: '3', name: 'Fabio Lemos', email: 'fabio@gabinete.gov', phone: '(11) 96666-5555', role: 'user', status: 'active', lastLogin: '2026-04-29 09:12', department: 'Atendimento' },
  { id: '4', name: 'Carla Dias', email: 'carla@gabinete.gov', phone: '(11) 95555-4444', role: 'user', status: 'inactive', lastLogin: '2026-04-20 11:00', department: 'Infraestrutura' },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  user: 'Operador'
};

const roleColors: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-100',
  manager: 'bg-blue-50 text-blue-700 border-blue-100',
  user: 'bg-green-50 text-green-700 border-green-100'
};

export default function Team() {
  const [search, setSearch] = useState('');
  const [team] = useState<TeamMember[]>(mockTeam);

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h1>
          <p className="text-gray-500 mt-1">Gerencie os membros do gabinete e seus níveis de acesso.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
          <UserPlus className="w-4 h-4" />
          Convidar Membro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Filtrar:</span>
            <select className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
              <option value="all">Todos os Níveis</option>
              <option value="admin">Administrador</option>
              <option value="manager">Gestor</option>
              <option value="user">Operador</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Membro</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Departamento</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nível de Acesso</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Último Acesso</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTeam.map((member) => (
                <tr key={member.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border-2 border-white shadow-sm">
                        {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{member.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {member.department}
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold",
                      roleColors[member.role]
                    )}>
                      <Shield className="w-3 h-3" />
                      {roleLabels[member.role]}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold",
                      member.status === 'active' ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                    )}>
                      {member.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {member.status === 'active' ? 'Ativo' : 'Inativo'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {member.lastLogin || 'Nunca acessou'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                      <Lock className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
