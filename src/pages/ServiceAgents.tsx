import { useState } from 'react';
import { Bot, User, Shield, Zap, CheckCircle, Clock, AlertTriangle, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface Agent {
  id: string;
  name: string;
  type: 'ai' | 'human';
  status: 'active' | 'busy' | 'offline';
  specialty: string;
  demandsHandled: number;
  rating: number;
}

const initialAgents: Agent[] = [
  { id: '1', name: 'Agente Virtual Luna', type: 'ai', status: 'active', specialty: 'Triagem Inicial e Classificação', demandsHandled: 1250, rating: 4.8 },
  { id: '2', name: 'Agente Virtual Orion', type: 'ai', status: 'active', specialty: 'Assuntos de Infraestrutura', demandsHandled: 840, rating: 4.7 },
  { id: '3', name: 'Assessor Fabio', type: 'human', status: 'busy', specialty: 'Demandas Políticas e Urgentes', demandsHandled: 320, rating: 4.9 },
  { id: '4', name: 'Assessora Mariana', type: 'human', status: 'active', specialty: 'Relações Comunitárias', demandsHandled: 215, rating: 4.9 },
];

export default function ServiceAgents() {
  const [agents] = useState<Agent[]>(initialAgents);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agentes de Atendimento</h1>
          <p className="text-gray-500 mt-1">Gerencie a triagem automática por IA e o suporte humano.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Settings className="w-4 h-4" />
          Configurar Fluxo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Automação IA</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Das demandas são triadas automaticamente</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Escala Humana</p>
              <p className="text-2xl font-bold text-gray-900">15%</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Exigem intervenção de um assessor</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Resolução Média</p>
              <p className="text-2xl font-bold text-gray-900">14h</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Tempo médio de resposta final</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Demandas aguardando triagem</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Equipe de Atendimento (IA & Humana)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Especialidade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Demandas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Avaliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        agent.type === 'ai' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {agent.type === 'ai' ? <Bot className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                      agent.type === 'ai' ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {agent.type === 'ai' ? 'Inteligência Artificial' : 'Humano'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{agent.specialty}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        agent.status === 'active' ? "bg-green-500" : 
                        agent.status === 'busy' ? "bg-yellow-500" : "bg-gray-400"
                      )} />
                      <span className="text-sm text-gray-700 capitalize">{agent.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{agent.demandsHandled.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Zap className="w-3 h-3 fill-current" />
                      <span className="font-bold">{agent.rating}</span>
                    </div>
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
