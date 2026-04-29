import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Appointment } from '../types';
import { useAppointments } from '../hooks/useApi';

export default function AppointmentList() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointments, total, loading, refresh, create, update, remove } = useAppointments(1, 100, statusFilter);

  const filteredAppointments = searchTerm
    ? appointments.filter(apt => 
        apt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : appointments;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      await remove(id);
    }
  };

  const handleView = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowModal(true);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'no-show', label: 'Não Compareceu' },
  ];

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500',
    confirmed: 'bg-yellow-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
    'no-show': 'bg-gray-500',
  };

  const statusBadgeColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    'no-show': 'bg-gray-100 text-gray-700',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const typeLabels: Record<string, string> = {
    meeting: 'Reunião',
    event: 'Evento',
    call: 'Ligação',
    visit: 'Visita',
    other: 'Outro',
  };

  const typeColors: Record<string, string> = {
    meeting: 'bg-purple-100 text-purple-700',
    event: 'bg-pink-100 text-pink-700',
    call: 'bg-cyan-100 text-cyan-700',
    visit: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700',
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-colors",
              view === 'list' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <CalendarDays className="w-4 h-4 inline mr-2" />
            Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-colors",
              view === 'calendar' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Calendário
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Compromisso
        </button>
      </div>

      {view === 'list' && (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar compromissos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{total} registro(s)</span>
        </div>
      )}

      {view === 'list' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Título</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data/Hora</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Local</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Prioridade</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhum compromisso encontrado
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", statusColors[apt.status])} />
                        <span className="text-sm font-medium text-gray-900">{apt.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        <div>{new Date(apt.date).toLocaleDateString('pt-BR')}</div>
                        {apt.time && <div className="text-xs text-gray-400">{apt.time}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{apt.location || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", typeColors[apt.type])}>
                        {typeLabels[apt.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priorityColors[apt.priority])}>
                        {apt.priority === 'low' ? 'Baixa' : apt.priority === 'medium' ? 'Média' : 'Alta'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusBadgeColors[apt.status])}>
                        {statusOptions.find(s => s.value === apt.status)?.label || apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(apt)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(apt.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{monthNames[currentDate.getMonth()]} de {currentDate.getFullYear()}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm hover:bg-gray-100 rounded-lg"
              >
                Hoje
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {getDaysInMonth(currentDate).map((date, i) => {
              const dayAppointments = date ? getAppointmentsForDate(date) : [];
              const isToday = date && date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[80px] p-2 border border-gray-100 rounded-lg",
                    date ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50",
                    isToday && "bg-blue-50 border-blue-200"
                  )}
                  onClick={() => date && setCurrentDate(date)}
                >
                  {date && (
                    <>
                      <div className={cn("text-sm font-medium mb-1", isToday ? "text-blue-600" : "text-gray-900")}>{date.getDate()}</div>
                      {dayAppointments.slice(0, 2).map((apt, j) => (
                        <div 
                          key={j} 
                          className={cn("text-xs text-gray-500 truncate px-1 py-0.5 rounded mb-0.5", statusColors[apt.status])}
                          onClick={(e) => { e.stopPropagation(); handleView(apt); }}
                        >
                          {apt.time} {apt.title}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-400">+{dayAppointments.length - 2} mais</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{selectedAppointment.title}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}</span>
              </div>
              {selectedAppointment.time && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{selectedAppointment.time}</span>
                </div>
              )}
              {selectedAppointment.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{selectedAppointment.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{selectedAppointment.attendees?.length || 0} participante(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Tipo:</span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", typeColors[selectedAppointment.type])}>
                  {typeLabels[selectedAppointment.type]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Prioridade:</span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priorityColors[selectedAppointment.priority])}>
                  {selectedAppointment.priority === 'low' ? 'Baixa' : selectedAppointment.priority === 'medium' ? 'Média' : 'Alta'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusBadgeColors[selectedAppointment.status])}>
                  {statusOptions.find(s => s.value === selectedAppointment.status)?.label || selectedAppointment.status}
                </span>
              </div>
              {selectedAppointment.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Descrição</h3>
                  <p className="text-sm text-gray-500">{selectedAppointment.description}</p>
                </div>
              )}
              {selectedAppointment.attendees && selectedAppointment.attendees.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Participantes</h3>
                  <div className="space-y-2">
                    {selectedAppointment.attendees.map((attendee, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{attendee.name}</div>
                          {attendee.email && <div className="text-xs text-gray-400">{attendee.email}</div>}
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          attendee.status === 'confirmed' && "bg-green-100 text-green-700",
                          attendee.status === 'pending' && "bg-yellow-100 text-yellow-700",
                          attendee.status === 'declined' && "bg-red-100 text-red-700"
                        )}>
                          {attendee.status === 'confirmed' ? 'Confirmado' : attendee.status === 'pending' ? 'Pendente' : 'Recusado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}