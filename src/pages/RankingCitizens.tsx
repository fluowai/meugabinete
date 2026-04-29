import { motion } from 'motion/react';
import { Users, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { mockData } from '../hooks/mockApi';
import { cn } from '../lib/utils';

export default function RankingCitizens() {
  // Calculate rankings based on number of requests
  const citizenStats = mockData.citizens.map(citizen => {
    const requestCount = mockData.requests.filter(r => r.requesterName === citizen.name).length;
    return {
      ...citizen,
      requestCount
    };
  }).sort((a, b) => b.requestCount - a.requestCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ranking de Cidadãos</h1>
        <p className="text-gray-500 mt-1">Cidadãos que mais interagem e enviam demandas ao gabinete.</p>
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
                "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4",
                index === 0 ? "bg-yellow-100 text-yellow-700" : 
                index === 1 ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-700"
              )}>
                {citizen.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{citizen.name}</h3>
              <p className="text-sm text-gray-500">{citizen.city}, {citizen.state}</p>
              <div className="mt-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{citizen.requestCount}</span>
                <span className="text-sm text-gray-500 font-medium">demandas</span>
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
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Localização</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Demandas</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tendência</th>
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
                  {citizen.neighborhood ? `${citizen.neighborhood}, ` : ''}{citizen.city}/{citizen.state}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (citizen.requestCount / (citizenStats[0]?.requestCount || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{citizen.requestCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span>Estável</span>
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
