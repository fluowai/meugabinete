import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Target, 
  Calendar, 
  MapPin, 
  Users, 
  TrendingUp,
  X,
  FileText,
  Megaphone,
  HeartHandshake,
  UserPlus,
  Gift
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Mobilization } from '../types';
import { useMobilizations } from '../hooks/useApi';

const typeConfig = {
  petition: { label: 'Petição', className: 'bg-orange-100 text-orange-800', icon: FileText },
  demonstration: { label: 'Manifestação', className: 'bg-red-100 text-red-800', icon: Megaphone },
  event: { label: 'Evento', className: 'bg-purple-100 text-purple-800', icon: Users },
  campaign: { label: 'Campanha', className: 'bg-blue-100 text-blue-800', icon: HeartHandshake },
  volunteer: { label: 'Voluntário', className: 'bg-green-100 text-green-800', icon: UserPlus },
  donation: { label: 'Doação', className: 'bg-yellow-100 text-yellow-800', icon: Gift },
};

const statusConfig = {
  planning: { label: 'Planejando', className: 'bg-gray-100 text-gray-800' },
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  completed: { label: 'Concluído', className: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
};

export default function Mobilizations() {
  const { data: mobilizations, loading } = useMobilizations();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMobilization, setSelectedMobilization] = useState<Mobilization | null>(null);

  const filteredMobilizations = mobilizations.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || m.type === typeFilter;
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const openDetails = (mobilization: Mobilization) => {
    setSelectedMobilization(mobilization);
  };

  const closeModal = () => {
    setSelectedMobilization(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const calculateProgress = (current?: number, target?: number) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round(((current || 0) / target) * 100), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar mobilizações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="petition">Petição</option>
            <option value="demonstration">Manifestação</option>
            <option value="event">Evento</option>
            <option value="campaign">Campanha</option>
            <option value="volunteer">Voluntário</option>
            <option value="donation">Doação</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="planning">Planejando</option>
            <option value="active">Ativo</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Mobilização
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMobilizations.map((mobilization) => {
            const type = typeConfig[mobilization.type];
            const status = statusConfig[mobilization.status];
            const TypeIcon = type.icon;
            const progress = calculateProgress(mobilization.currentGoal, mobilization.targetGoal);

            return (
              <motion.div
                key={mobilization.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => openDetails(mobilization)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", type.className.split(' ')[0].replace('text', 'bg'))}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className={cn("px-2 py-1 rounded-full text-xs font-medium", type.className)}>
                    {type.label}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{mobilization.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{mobilization.description}</p>

                {mobilization.targetGoal && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Progresso</span>
                      <span className="font-medium text-gray-900">
                        {mobilization.currentGoal?.toLocaleString('pt-BR') || 0} / {mobilization.targetGoal.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn("h-full rounded-full", 
                          progress >= 100 ? "bg-green-500" : 
                          progress >= 50 ? "bg-blue-500" : "bg-orange-500"
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {mobilization.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(mobilization.startDate)}</span>
                    </div>
                  )}
                  {mobilization.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{mobilization.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.className)}>
                    {status.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredMobilizations.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma mobilização encontrada</p>
        </div>
      )}

      <AnimatePresence>
        {selectedMobilization && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", typeConfig[selectedMobilization.type].className.split(' ')[0].replace('text', 'bg'))}>
                        {(() => {
                          const TypeIcon = typeConfig[selectedMobilization.type].icon;
                          return <TypeIcon className="w-6 h-6" />;
                        })()}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedMobilization.name}</h2>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", typeConfig[selectedMobilization.type].className)}>
                          {typeConfig[selectedMobilization.type].label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Descrição</p>
                      <p className="text-gray-900">{selectedMobilization.description}</p>
                    </div>

                    {selectedMobilization.targetGoal && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Progresso</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${calculateProgress(selectedMobilization.currentGoal, selectedMobilization.targetGoal)}%` }}
                              className={cn("h-full rounded-full", 
                                calculateProgress(selectedMobilization.currentGoal, selectedMobilization.targetGoal) >= 100 ? "bg-green-500" : 
                                calculateProgress(selectedMobilization.currentGoal, selectedMobilization.targetGoal) >= 50 ? "bg-blue-500" : "bg-orange-500"
                              )}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {calculateProgress(selectedMobilization.currentGoal, selectedMobilization.targetGoal)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedMobilization.currentGoal?.toLocaleString('pt-BR') || 0} / {selectedMobilization.targetGoal.toLocaleString('pt-BR')} atingidos
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Data de Início</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{formatDate(selectedMobilization.startDate)}</span>
                        </div>
                      </div>
                      {selectedMobilization.endDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Data de Término</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{formatDate(selectedMobilization.endDate)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedMobilization.location && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Local</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{selectedMobilization.location}</span>
                        </div>
                      </div>
                    )}

                    {selectedMobilization.tags.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMobilization.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusConfig[selectedMobilization.status].className)}>
                        {statusConfig[selectedMobilization.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}