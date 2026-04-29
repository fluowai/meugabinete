import { useState } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  MapPin,
  Users,
  MessageSquare,
  Tag,
  TrendingUp
} from 'lucide-react';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  lastGenerated: string;
  stats: {
    total: number;
    growth: string;
  };
}

const reportTypes: ReportType[] = [
  {
    id: 'demandas-geral',
    name: 'Demandas Gerais',
    description: 'Relatório completo de todas as demandas e seus respectivos status',
    icon: FileText,
    lastGenerated: '2026-04-29',
    stats: { total: 156, growth: '+15%' },
  },
  {
    id: 'demandas-bairro',
    name: 'Demandas por Bairro',
    description: 'Análise geográfica das solicitações para identificar áreas críticas',
    icon: MapPin,
    lastGenerated: '2026-04-28',
    stats: { total: 12, growth: 'Centro' },
  },
  {
    id: 'cidadaos-engajados',
    name: 'Ranking de Cidadãos',
    description: 'Lista dos cidadãos que mais interagem e enviam demandas',
    icon: Users,
    lastGenerated: '2026-04-29',
    stats: { total: 450, growth: '+22%' },
  },
  {
    id: 'assuntos-recorrentes',
    name: 'Temas Críticos',
    description: 'Relatório sobre os assuntos mais reclamados (Iluminação, Saneamento, etc)',
    icon: Tag,
    lastGenerated: '2026-04-27',
    stats: { total: 8, growth: 'Iluminação' },
  },
  {
    id: 'atendimento-whatsapp',
    name: 'Performance WhatsApp',
    description: 'Métricas de tempo de resposta e resolutividade via chat',
    icon: MessageSquare,
    lastGenerated: '2026-04-29',
    stats: { total: 2840, growth: '+40%' },
  },
  {
    id: 'ia-classificacao',
    name: 'Eficácia da IA',
    description: 'Relatório de precisão da classificação automática de demandas',
    icon: TrendingUp,
    lastGenerated: '2026-04-25',
    stats: { total: 98, growth: '98%' },
  },
];

export default function Reports() {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>(
    reportTypes.reduce((acc, r) => ({ ...acc, [r.id]: r.lastGenerated }), {})
  );

  const handleGenerateReport = (report: ReportType) => {
    setGeneratingId(report.id);
    setTimeout(() => {
      const now = new Date().toISOString().split('T')[0];
      setLastGenerated((prev) => ({ ...prev, [report.id]: now }));
      setGeneratingId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios Estratégicos</h1>
          </div>
          <p className="text-gray-500">
            Gere dados para subsidiar decisões no Gabinete do Vice-Prefeito
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isGenerating = generatingId === report.id;

          return (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-wider">
                  {report.stats.growth}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {report.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">
                {report.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pt-4 border-t border-gray-50">
                <span>Total de Registros: <b className="text-gray-700">{report.stats.total.toLocaleString()}</b></span>
                <span>
                  Último: {lastGenerated[report.id]}
                </span>
              </div>

              <button
                onClick={() => handleGenerateReport(report)}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Gerar PDF / Excel
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}