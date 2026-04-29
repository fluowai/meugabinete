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
  { id: '1', label: 'Gerar Texto', icon: 'sparkles', prompt: 'Gere um texto de boas-vindas para novos voluntários do gabinete.' },
  { id: '2', label: 'Analisar Dados', icon: 'chart', prompt: `Analise os dados do dashboard e sugira ações baseados nos números atuais (${mockData.dashboardStats.citizens} cidadãos, ${mockData.dashboardStats.organizations} organizações).` },
  { id: '3', label: 'Sugestão', icon: 'lightbulb', prompt: 'Me sugira ações estratégicas para aumentar o engajamento dos cidadãos.' },
  { id: '4', label: 'FAQ', icon: 'help', prompt: 'Liste as dúvidas frequentes sobre o uso do sistema.' },
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
      content: 'Olá! Sou o assistente IA do seu Gabinete 360. Posso ajudá-lo a gerar textos, analisar dados, sugerir ações estratégicas e responder dúvidas. Como posso ajudar hoje?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('gerar texto') || lowerMessage.includes('boas-vindas')) {
      return `Aqui está um texto de boas-vindas para novos voluntários:

"Bem-vindo ao nosso time! 🚀

Você acaba de se unir a uma equipe dedicada a fazer a diferença na vida das pessoas. Seu trabalho é fundamental para fortalecer a conexão entre o gabinete e a comunidade.

Juntos, vamos:
- Aproximar os cidadãos das decisões políticas
- Facilitar o acesso a serviços e benefícios
- Manter um canal aberto de dialogo com a população

Contamos com você nessa missão! 

Atenciosamente,
Gabinete 360"`;
    }
    
    if (lowerMessage.includes('analisar dados') || lowerMessage.includes('dashboard')) {
      const stats = mockData.dashboardStats;
      return `Análise dos dados do Dashboard:

**Números Atuais:**
- Cidadãos: ${stats.citizens.toLocaleString('pt-BR')} (+${stats.citizensGrowth}% no mês)
- Organizações: ${stats.organizations} (+${stats.organizationsGrowth}%)
- Compromissos: ${stats.appointments} (${stats.appointmentsGrowth < 0 ? `${Math.abs(stats.appointmentsGrowth)}% negativo` : `+${stats.appointmentsGrowth}%`})
- Landing Pages: ${stats.landingPages} (+${stats.landingPagesGrowth}%)
- Mobilizações: ${stats.mobilizations} (+${stats.mobilizationsGrowth}%)

**Sugestões:**
1. O numero de cidadãos cresceu bem! Considere criar uma campanha de engajamento para manter o ritmo.
2. As mobilizações estão com bom desempenho. Talvez seja hora de planejar uma nova.
3. Compromissos tiveram queda. Sugiro revisar a agenda e priorizar agendamentos.`;
    }
    
    if (lowerMessage.includes('sugestão') || lowerMessage.includes('ações estratégicas') || lowerMessage.includes('engajamento')) {
      return `Sugestões estratégicas:

1. **Campanha de Mobilização**
   - Crie eventos presenciais em comunidades estratégicas
   - Use as ${mockData.dashboardStats.landingPages} landing pages para captação

2. **Relacionamento com Órgãos**
   - Fortaleça parcerias com as ${mockData.dashboardStats.organizations} organizações cadastradas
   - Agende reuniões de alinhamento

3. **Captação de Voluntários**
   - Utilize os dados dos ${mockData.dashboardStats.citizens.toLocaleString('pt-BR')} cidadãos para identificar lideranças
   - Ofereça treinamento para novos ativistas

4. **Comunicação**
   - Mantenha o diálogo ativo via WhatsApp
   - Publique conteúdos nas redes sociais`;
    }
    
    if (lowerMessage.includes('faq') || lowerMessage.includes('duvidas') || lowerMessage.includes('dúvidas')) {
      return `Perguntas Frequentes (FAQ):

**1. Como adicionar um novo cidadão?**
Acesse "Cidadãos" > "Novo Cidadão" > Preencha os dados > Salvar

**2. Como criar uma mobilização?**
Acesse "Mobilizações" > "Nova Mobilização" > Defina objetivo e data > Criar

**3. Como agendar um compromisso?**
Acesse "Compromissos" > "Novo Compromisso" > Selecione cidadão > Escolha data/hora

**4. Como enviar mensagens em massa?**
Acesse "Campanhas" > Selecione o público > Escreva a mensagem > Enviar

**5. Como gerar relatórios?**
Acesse "Relatórios" > Escolha o tipo > Defina o período > Exportar`;
    }
    
    return `Entendi sua mensagem: "${userMessage.slice(0, 50)}..."

Posso ajudá-lo com:
- 📝 Geração de textos e comunicações
- 📊 Análise de dados do dashboard
- 💡 Sugestões estratégicas
- ❓ Perguntas frequentes sobre o sistema

Digite ou selecione uma das opções acima para continuar.`;
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