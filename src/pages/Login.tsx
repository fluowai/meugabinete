import { useState } from 'react';
import { motion } from 'motion/react';
import { Layout, User as UserIcon, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useStore } from '../stores/appStore';

export default function Login() {
  const login = useStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = await login(email, password);
      if (!success) {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0C10]">
      {/* Background with Gradients and Glows */}
      <div className="absolute inset-0 z-0 bg-[#0A0C10]">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-[#0A0C10] to-blue-600/10" />
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-900/20 rounded-full blur-[100px] z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[420px] z-10 p-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col items-center mb-10 relative">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/30 mb-4">
              <Layout className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">GABINETE 360</h1>
            <p className="text-gray-400 text-sm mt-2">Acesse sua plataforma de gestão inteligente</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Usuário</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative w-4 h-4 rounded bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-blue-500 rounded-sm" />
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Lembrar-me</span>
              </label>
              <button type="button" className="text-xs text-blue-500 hover:text-blue-400 transition-colors font-medium">Esqueceu a senha?</button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Não tem uma conta? <button className="text-blue-500 font-semibold hover:text-blue-400 transition-colors">Solicite acesso</button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-medium">&copy; 2026 GABINETE 360 &bull; Gestão Pública Inteligente</p>
        </div>
      </motion.div>
    </div>
  );
}
