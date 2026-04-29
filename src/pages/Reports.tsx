import { useState } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Users,
  Building2,
  Target,
  MessageSquare,
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
    id: 'cidadoes',
    name: 'Cidadãos',
    description: 'Relatório completo de cidadãos registrados no sistema',
    icon: Users,
    lastGenerated: '2026-04-23',
    stats: { total: 1247, growth: '+12%' },
  },
  {
    id: 'organizacoes',
    name: 'Organizações',
    description: 'Visão geral das organizações parceiras e colaboradores',
    icon: Building2,
    lastGenerated: '2026-04-22',
    stats: { total: 89, growth: '+5%' },
  },
  {
    id: 'compromissos',
    name: 'Compromissos',
    description: 'Relatório de compromissos e reuniões agendadas',
    icon: Calendar,
    lastGenerated: '2026-04-24',
    stats: { total: 342, growth: '+8%' },
  },
  {
    id: 'mobilizacoes',
    name: 'Mobilizações',
    description: 'Análise de campanhas de mobilização e engajamento',
    icon: Target,
    lastGenerated: '2026-04-21',
    stats: { total: 56, growth: '+23%' },
  },
  {
    id: 'landing-pages',
    name: 'Landing Pages',
    description: 'Performance das landing pages e taxas de conversão',
    icon: MessageSquare,
    lastGenerated: '2026-04-20',
    stats: { total: 23450, growth: '+18%' },
  },
  {
    id: 'solicitacoes',
    name: 'Solicitações',
    description: 'Relatório de solicitações recebidas estatus',
    icon: FileText,
    lastGenerated: '2026-04-23',
    stats: { total: 891, growth: '+7%' },
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
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        </div>
        <p className="text-gray-600">
          Gere e visualize relatórios detalhados do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isGenerating = generatingId === report.id;

          return (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                  {report.stats.growth}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {report.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Total: {report.stats.total.toLocaleString()}</span>
                <span>
                  Último: {lastGenerated[report.id]}
                </span>
              </div>

              <button
                onClick={() => handleGenerateReport(report)}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Gerar Relatório
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