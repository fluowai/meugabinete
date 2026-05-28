import { motion } from 'motion/react';
import { Award, TrendingUp, User, MessageSquare } from 'lucide-react';
import { useCitizens } from '../hooks/useApi';
import { cn } from '../lib/utils';

export default function RankingCitizens() {
  const { data: citizens, loading } = useCitizens(1, 1000);
  const citizenStats = [...citizens].sort((a, b) => (b.score || 0) - (a.score || 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ranking de Cidadãos e Lideranças</h1>
        <p className="text-gray-500 mt-1">Pontuação baseada no volume e qualidade das demandas enviadas via WhatsApp.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {citizenStats.slice(0, 3).map((citizen, index) => (
          <motion.div
            key={citizen.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "bg-white p-6 rounded-xl border-2 relative overflow-hidden",
              index === 0 ? "border-yellow-400 shadow-yellow-50/50 shadow-lg" : 
              index === 1 ? "border-gray-300" : "border-orange-300"
            )}
          >
            <div className="absolute top-4 right-4">
              <Award className={cn(
                "w-8 h-8",
                index === 0 ? "text-yellow-400" : 
                index === 1 ? "text-gray-400" : "text-orange-400"
              )} />
            </div>
            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 text-white",
                index === 0 ? "bg-yellow-500 shadow-lg shadow-yellow-200" : 
                index === 1 ? "bg-gray-400 shadow-lg shadow-gray-200" : "bg-orange-400 shadow-lg shadow-orange-200"
              )}>
                {citizen.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{citizen.name}</h3>
              <p className="text-sm text-gray-500">{citizen.city}, {citizen.state}</p>
              <div className="mt-4 flex flex-col items-center">
                <div className="flex items-center gap-1 text-2xl font-black text-gray-900">
                  <span>{citizen.score || 0}</span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">pontos de engajamento</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Posição</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cidadão</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bairro</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Demandas</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {citizenStats.map((citizen, index) => (
              <tr key={citizen.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                    index === 0 ? "bg-yellow-100 text-yellow-700" :
                    index === 1 ? "bg-gray-100 text-gray-700" :
                    index === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-50 text-gray-500"
                  )}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium text-xs">
                      {citizen.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{citizen.name}</div>
                      <div className="text-xs text-gray-500">{citizen.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {citizen.neighborhood || 'Centro'}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                    <MessageSquare className="w-3 h-3" />
                    {(citizen as any).totalDemands || Math.floor((citizen.score || 0) / 10)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-blue-600 text-lg">{citizen.score || 0}</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
