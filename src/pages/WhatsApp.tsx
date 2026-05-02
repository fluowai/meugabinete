import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Shield, 
  RefreshCcw, 
  Trash2, 
  Smartphone, 
  QrCode,
  CheckCircle,
  Clock,
  Settings,
  Zap,
  Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'conexoes' | 'mensagens' | 'campanhas';

interface Instance {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qrCode?: string;
  uptime?: string;
}

export default function WhatsAppHub() {
  const [activeTab, setActiveTab] = useState<Tab>('conexoes');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const getBaseUrl = () => {
    let baseUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';
    if (baseUrl && !baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    return baseUrl;
  };

  const fetchQrCode = async () => {
    setLoadingQr(true);
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/qr`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const code = await response.text();
        setQrCode(code);
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    } finally {
      setLoadingQr(false);
    }
  };

  const fetchQrCode = async () => {
    setLoadingQr(true);
    try {
      let baseUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || '';
      if (baseUrl && !baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      
      const response = await fetch(`${baseUrl}/qr`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const code = await response.text();
        setQrCode(code);
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    } finally {
      setLoadingQr(false);
    }
  };

  const openQr = (instance: Instance) => {
    setSelectedInstance(instance);
    setIsQrModalOpen(true);
    setQrCode('');
    fetchQrCode();
  };

  const openNewInstanceModal = () => {
    setShowNameInput(true);
  };

  const startNewInstance = () => {
    const newInstance: Instance = {
      id: Date.now().toString(),
      name: newInstanceName || `Nova Instância ${instances.length + 1}`,
      phone: 'Aguardando conexão...',
      status: 'disconnected'
    };
    setShowNameInput(false);
    setInstances(prev => [...prev, newInstance]);
    openQr(newInstance);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hub do WhatsApp</h1>
          <p className="text-gray-500 mt-1">Gerencie conexões, automação e triagem por IA.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95">
            <Zap className="w-4 h-4" />
            Configurar IA
          </button>
          <button 
            onClick={openNewInstanceModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Instância
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        {[
          { id: 'conexoes', label: 'Conexões', icon: Smartphone },
          { id: 'mensagens', label: 'Mensagens/Demandas', icon: MessageSquare },
          { id: 'campanhas', label: 'Campanhas de Envio', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'conexoes' && (
          <motion.div
            key="conexoes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {instances.map(instance => (
              <div key={instance.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="flex items-start justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                    instance.status === 'connected' ? "bg-green-100 text-green-600 shadow-green-100" : "bg-gray-100 text-gray-400 shadow-gray-100"
                  )}>
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    instance.status === 'connected' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                  )}>
                    {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900">{instance.name}</h3>
                  <p className="text-sm font-medium text-gray-500">{instance.phone}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                  {instance.status === 'connected' ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tempo de Atividade</span>
                      <span className="text-sm font-bold text-gray-700">{instance.uptime}</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => openQr(instance)}
                      className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                    >
                      <QrCode className="w-4 h-4" />
                      Gerar QR Code
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'mensagens' && (
          <motion.div
            key="mensagens"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar mensagens..."
                  className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Escuta em tempo real ativa</span>
                </div>
              </div>
            </div>
            
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Sem mensagens no momento</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Conecte uma instância e as demandas do WhatsApp começarão a aparecer aqui automaticamente após triagem por IA.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nome da Instância */}
      <AnimatePresence>
        {showNameInput && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden p-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Nova Conexão</h2>
                <p className="text-gray-500 text-sm mb-8">Dê um nome para esta instância do WhatsApp (ex: Atendimento Saúde).</p>
                
                <input
                  type="text"
                  placeholder="Nome da Instância"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="w-full h-14 px-6 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-bold focus:outline-none focus:border-blue-500 transition-all mb-6"
                />

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowNameInput(false)}
                    className="flex-1 h-14 bg-gray-100 text-gray-500 text-sm font-black uppercase tracking-widest rounded-2xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={startNewInstance}
                    className="flex-1 h-14 bg-blue-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-200"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal QR Code */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mb-6">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Conectar WhatsApp</h2>
                <p className="text-gray-500 text-sm mb-8">Escaneie o código abaixo com o seu WhatsApp para ativar a instância <strong>{selectedInstance?.name}</strong>.</p>
                
                <div className="relative p-4 bg-white border-4 border-gray-50 rounded-3xl shadow-inner mb-8">
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-2xl overflow-hidden">
                    {qrCode ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`} 
                        alt="WhatsApp QR Code"
                        className="w-full h-full"
                      />
                    ) : (
                      <QrCode className="w-32 h-32 text-gray-300" />
                    )}
                  </div>
                  {(loadingQr || !qrCode) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                          {loadingQr ? 'Buscando QR...' : 'Aguardando Backend...'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={fetchQrCode}
                    className="flex-1 h-14 bg-blue-50 text-blue-600 text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Atualizar
                  </button>
                  <button 
                    onClick={() => setIsQrModalOpen(false)}
                    className="flex-1 h-14 bg-gray-100 text-gray-500 text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}