import { useState } from 'react';
import { Cpu, MessageSquare, Send, Sparkles, X, Bot, User } from 'lucide-react';
import { mockData } from '../hooks/mockApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  label: string;
  icon: 'sparkles' | 'chart' | 'lightbulb' | 'help';
  prompt: string;
}

const suggestions: Suggestion[] = [
  { id: '1', label: 'Classificar Demanda', icon: 'sparkles', prompt: 'Classifique esta demanda: "Tem um bueiro entupido na Rua das Palmeiras, 300, bairro Centro. Está cheirando mal e alagando a rua."' },
  { id: '2', label: 'Resumir Relatos', icon: 'chart', prompt: 'Resuma as principais demandas do bairro Centro nos últimos 7 dias.' },
  { id: '3', label: 'Encaminhamento', icon: 'lightbulb', prompt: 'Para qual secretaria devo enviar uma demanda de iluminação pública?' },
  { id: '4', label: 'Ranking', icon: 'help', prompt: 'Quem são os cidadãos mais engajados este mês?' },
];

const iconMap = {
  sparkles: Sparkles,
  chart: Cpu,
  lightbulb: Sparkles,
  help: MessageSquare,
};

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o assistente IA do Gabinete do Vice-Prefeito. Estou aqui para ajudar a classificar, resumir e encaminhar demandas populares recebidas via WhatsApp. Como posso ajudar hoje?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('classificar') || lowerMessage.includes('bueiro')) {
      return `### 🤖 Análise de Demanda via IA
      
**Resumo:** Obstrução de bueiro com alagamento em via pública.
**Assunto:** Saneamento / Drenagem Urbana.
**Bairro Detectado:** Centro.
**Prioridade Sugerida:** Alta (Risco de alagamento).
**Encaminhamento Recomendado:** Secretaria de Obras e Serviços Urbanos (Equipe de Hidrojateamento).`;
    }
    
    if (lowerMessage.includes('resuma') || lowerMessage.includes('relatos')) {
      return `### 📊 Resumo de Demandas - Bairro Centro (7 dias)

Identifiquei **12 novas demandas** no bairro Centro esta semana:
- **60%** Iluminação Pública (Lâmpadas queimadas na Praça Central)
- **25%** Coleta de Lixo (Atraso na Rua 1)
- **15%** Segurança (Solicitação de patrulhamento)

**Tendência:** Houve um aumento de 15% nas reclamações de iluminação em comparação à semana anterior.`;
    }
    
    if (lowerMessage.includes('encaminhamento') || lowerMessage.includes('iluminação')) {
      return `### 📍 Guia de Encaminhamento

Para demandas de **Iluminação Pública**, o fluxo correto é:
1. Validar se o poste possui identificação (braço/número).
2. Encaminhar via sistema interno para a **Secretaria de Infraestrutura (Departamento de Iluminação)**.
3. Notificar o cidadão via WhatsApp que o protocolo foi aberto.

**Dica:** Se for em praça pública, a responsabilidade é da Secretaria de Meio Ambiente e Zeladoria.`;
    }
    
    if (lowerMessage.includes('ranking') || lowerMessage.includes('engajados')) {
      return `### 🏆 Cidadãos mais Engajados

Os cidadãos que mais enviaram demandas validadas recentemente são:
1. **João Silva Santos** (Centro) - 15 demandas
2. **Maria Oliveira** (Jardim América) - 12 demandas
3. **Pedro Henrique** (Vila Nova) - 9 demandas

Estes cidadãos costumam ser excelentes informantes sobre problemas nos bairros.`;
    }
    
    return `Entendi sua mensagem. Como assistente do Gabinete, posso ajudar você a:
- **Classificar** mensagens do WhatsApp em categorias de demandas.
- **Resumir** o que os cidadãos de um bairro estão pedindo.
- **Sugerir** para qual secretaria municipal encaminhar cada caso.
- **Identificar** tendências e pontos críticos na cidade.

O que deseja fazer agora?`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsTyping(true);
    
    const response = await getAIResponse(input);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSuggestion = async (suggestion: Suggestion) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: suggestion.prompt,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setShowSuggestions(false);
    setIsTyping(true);
    
    const response = await getAIResponse(suggestion.prompt);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Olá! Sou o assistente IA do seu Gabinete 360. Posso ajudá-lo a gerar textos, analisar dados, sugerir ações estratégicas e responder dúvidas. Como posso ajudar hoje?',
        timestamp: new Date(),
      },
    ]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assistente IA</h1>
            <p className="text-gray-500 text-sm">Inteligência Artificial do Gabinete 360</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Limpar Chat
        </button>
      </div>

      {showSuggestions && messages.length === 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {suggestions.map(suggestion => {
            const Icon = iconMap[suggestion.icon];
            return (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestion(suggestion)}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{suggestion.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' ? 'bg-gray-100' : 'bg-gradient-to-br from-blue-600 to-purple-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-gray-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`p-4 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-md' 
                    : 'bg-gray-50 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}