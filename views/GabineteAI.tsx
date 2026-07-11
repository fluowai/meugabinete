import React, { useState } from 'react';
import { Bot, ClipboardCheck, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { callApi } from '../src/lib/api';
import { toast } from 'sonner';

const GabineteAI: React.FC = () => {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const data = await callApi('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Analise esta mensagem de cidadao para um gabinete publico. Retorne um resumo curto, categoria, prioridade, dados faltantes e proxima acao:\n\n${message}`,
          systemInstruction: 'Voce e um assessor de gabinete especializado em triagem de demandas publicas. Seja objetivo e pratico.',
        }),
      });
      setResult(data.text || data.result || '');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao analisar mensagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Bot size={28} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">IA de triagem</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Classifique demandas em segundos</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Cole uma mensagem recebida pelo WhatsApp para obter categoria, urgência, dados faltantes e próxima ação sugerida.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
            <MessageSquare size={18} className="text-primary" /> Mensagem do cidadão
          </h3>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-72 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Ex: Boa tarde, estou precisando de ajuda para marcar uma consulta..."
          />
          <button
            type="button"
            onClick={analyze}
            disabled={loading || !message.trim()}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Analisar demanda
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
            <ClipboardCheck size={18} className="text-primary" /> Resultado
          </h3>
          <div className="min-h-72 rounded-xl border border-slate-100 bg-slate-50 p-5">
            {result ? (
              <pre className="whitespace-pre-wrap font-sans text-sm font-medium leading-relaxed text-slate-700">{result}</pre>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center text-slate-300">
                <Sparkles size={42} />
                <p className="mt-3 text-xs font-black uppercase tracking-widest">A análise aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GabineteAI;
