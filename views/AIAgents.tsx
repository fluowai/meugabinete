import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpen,
  Bot,
  Brain,
  CalendarClock,
  ChevronLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Database,
  FileSearch,
  FileText,
  Gauge,
  Headphones,
  Home,
  Key,
  LayoutGrid,
  Loader2,
  MessageCircle,
  MessageSquareText,
  Mic,
  MoveRight,
  PhoneCall,
  Play,
  Plus,
  Radio,
  Repeat2,
  Rocket,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Smartphone,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  WandSparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiAgentService, type AIAgent, type AIAgentPayload, type AgentFlowStep, type AgentMetrics } from '../services/aiAgents';
import { callApi } from '../src/lib/api';
import { instanceApi, type Instance as WhatsAppInstance } from './WhatsApp/hooks/api';

type BuilderDraft = AIAgentPayload & {
  status?: string;
  autonomy_level?: number;
  channels?: string[];
  instances?: string[];
  description?: string;
  operation_mode?: string;
  channel_scope?: string;
  handoff?: Record<string, unknown>;
  flow_steps?: AgentFlowStep[];
};

type TemplatePreset = {
  name: string;
  role: string;
  description: string;
  tags: string[];
  accent: string;
  avatar: string;
  payload: BuilderDraft;
};

type Option = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
};

type TestMessage = {
  id: string;
  side: 'cidadao' | 'agent';
  content: string;
};

type TestMode = 'cidadao-simulator' | 'agent-reply';

const channels = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'site', label: 'Site' },
  { id: 'crm', label: 'CRM' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'email', label: 'E-mail' },
];

const workspaces: Option[] = [
  {
    id: 'Triagem de demandas',
    label: 'Triagem de demandas',
    description: 'Recebe cidadãos, classifica demandas e inicia atendimento.',
    icon: MessageSquareText,
  },
  {
    id: 'Kanban de atendimento',
    label: 'Kanban de atendimento',
    description: 'Cria cards, atualiza etapas e registra próximos passos.',
    icon: LayoutGrid,
  },
  {
    id: 'Documentação',
    label: 'Documentação',
    description: 'Classifica documentos, PDFs e pendências da demanda.',
    icon: FileSearch,
  },
  {
    id: 'Follow-up',
    label: 'Follow-up',
    description: 'Mantém retorno com timing e contexto ao cidadão.',
    icon: Repeat2,
  },
  {
    id: 'Agenda',
    label: 'Agenda',
    description: 'Sugere horários e organiza atendimentos com o time.',
    icon: CalendarClock,
  },
  {
    id: 'Monitoramento territorial',
    label: 'Monitoramento territorial',
    description: 'Acompanha indicadores de bairros, demandas e sentimento.',
    icon: Target,
  },
  {
    id: 'Pós-atendimento',
    label: 'Pós-atendimento',
    description: 'Acompanha satisfação, tarefas e novas interações.',
    icon: BadgeCheck,
  },
];

const autonomyLevels = [
  {
    id: 1,
    label: 'Assistido',
    description: 'Sugere ações, mas precisa de aprovação humana.',
    icon: ShieldCheck,
  },
  {
    id: 2,
    label: 'Semiautônomo',
    description: 'Executa ações simples e pede aprovação em casos críticos.',
    icon: Gauge,
  },
  {
    id: 3,
    label: 'Autônomo',
    description: 'Responde, movimenta Kanban, agenda follow-ups e aciona humanos quando necessário.',
    icon: Zap,
  },
];

const toolOptions = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'agenda', label: 'Agenda', icon: CalendarClock },
  { id: 'crm', label: 'CRM', icon: Database },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'pdf-reader', label: 'PDF Reader', icon: FileSearch },
  { id: 'audio-stt', label: 'Audio STT', icon: Mic },
  { id: 'monitoramento', label: 'Monitoramento', icon: Target },
  { id: 'follow-up', label: 'Follow-up', icon: Repeat2 },
  { id: 'notificar-assessor', label: 'Notificação ao assessor', icon: BellRing },
  { id: 'criar-tarefa', label: 'Criar tarefa', icon: ClipboardCheck },
  { id: 'mover-etapa-funil', label: 'Mover etapa do funil', icon: MoveRight },
];

const handoffRules = [
  { id: 'reuniao_solicitada', label: 'Cidadão pediu reunião' },
  { id: 'demanda_sensivel', label: 'Demanda sensível ou política' },
  { id: 'documento_enviado', label: 'Cidadão enviou documento' },
  { id: 'demanda_urgente', label: 'Demanda urgente identificada' },
  { id: 'cidadao_irritado', label: 'Cidadão insatisfeito ou irritado' },
  { id: 'baixa_confianca', label: 'IA não tem certeza' },
  { id: 'crise_detectada', label: 'Possível crise identificada' },
];

const tabs = [
  { id: 'identity', label: 'Perfil do agente', icon: UserCheck },
  { id: 'channels', label: 'Canais', icon: Radio },
  { id: 'prompt', label: 'Prompt e funil', icon: MessageSquareText },
  { id: 'operation', label: 'Jornada comercial', icon: Workflow },
  { id: 'tools', label: 'Acoes permitidas', icon: Settings2 },
  { id: 'rules', label: 'Transbordo', icon: ShieldCheck },
  { id: 'brain', label: 'Aprendizado', icon: Brain },
  { id: 'test', label: 'Simulacao', icon: Play },
];

const flowSteps = [
  { title: 'Atende', subtitle: 'Recebe e responde o cidadão', icon: Headphones },
  { title: 'Classifica', subtitle: 'Categoria, urgência e bairro', icon: ClipboardCheck },
  { title: 'Cria demanda', subtitle: 'Card, protocolo e próxima ação', icon: LayoutGrid },
  { title: 'Encaminha', subtitle: 'Direciona para secretaria/setor', icon: Target },
  { title: 'Agenda', subtitle: 'Reunião, audiência ou retorno', icon: CalendarClock },
  { title: 'Transborda', subtitle: 'Assessor recebe contexto', icon: UserPlus },
  { title: 'Acompanha', subtitle: 'Follow-up até resolução', icon: Repeat2 },
];

const salesProcessSteps = [
  {
    title: 'Recepção e triagem',
    description: 'Identifica cidadão, motivo da visita, demanda ou solicitação.',
    icon: PhoneCall,
  },
  {
    title: 'Classificação',
    description: 'Categoria da demanda, bairro, urgência, dados pessoais e histórico.',
    icon: Target,
  },
  {
    title: 'Registro da demanda',
    description: 'Cria ou atualiza demanda no CRM, registra protocolo e define próxima ação.',
    icon: Workflow,
  },
  {
    title: 'Encaminhamento',
    description: 'Direciona para a secretaria/setor competente e prepara contexto.',
    icon: Sparkles,
  },
  {
    title: 'Acompanhamento',
    description: 'Agenda retorno, cria follow-up, aciona assessor e acompanha resolução.',
    icon: Rocket,
  },
];

const operatingModes = [
  {
    title: 'Recepcionista digital',
    description: 'Ideal para WhatsApp conectado: responde rápido, classifica e cria a demanda no CRM.',
    tools: ['whatsapp', 'crm', 'kanban', 'follow-up'],
  },
  {
    title: 'Assessor de atendimento',
    description: 'Conduz classificação, encaminhamento, follow-up e transbordo para assessor humano.',
    tools: ['monitoramento', 'agenda', 'notificar-assessor', 'mover-etapa-funil'],
  },
  {
    title: 'Atendimento completo',
    description: 'Opera do primeiro contato ao pós-atendimento, mantendo histórico, tarefas e retornos.',
    tools: ['whatsapp', 'crm', 'kanban', 'monitoramento', 'follow-up', 'criar-tarefa'],
  },
];

const funnelBuilderSteps: (AgentFlowStep & { icon: React.ElementType })[] = [
  {
    id: 'entrada',
    title: 'Entrada',
    trigger: 'Nova mensagem no WhatsApp',
    prompt: 'Cumprimente, identifique o cidadão e confirme o motivo do contato: demanda, informação, elogio ou reclamação.',
    action: 'Criar ou localizar cidadão',
    enabled: true,
    icon: MessageCircle,
  },
  {
    id: 'classificacao',
    title: 'Classificação',
    trigger: 'Cidadão descreveu a demanda',
    prompt: 'Pergunte categoria da demanda, bairro, urgência e dados de contato se ainda não tiver.',
    action: 'Atualizar perfil e score',
    enabled: true,
    icon: ClipboardCheck,
  },
  {
    id: 'encaminhamento',
    title: 'Encaminhamento',
    trigger: 'Classificação completa',
    prompt: 'Identifique a secretaria/setor competente, crie o protocolo e encaminhe com contexto.',
    action: 'Criar demanda e encaminhar',
    enabled: true,
    icon: Target,
  },
  {
    id: 'processo',
    title: 'Acompanhamento',
    trigger: 'Demanda encaminhada',
    prompt: 'Registre ação, crie follow-up com data e mantenha o cidadão informado sobre o andamento.',
    action: 'Registrar e criar tarefa',
    enabled: true,
    icon: Workflow,
  },
  {
    id: 'transbordo',
    title: 'Transbordo',
    trigger: 'Demanda sensível ou alta complexidade',
    prompt: 'Acione o assessor com resumo do cidadão, demanda, urgência, documentos e próximo passo recomendado.',
    action: 'Notificar assessor',
    enabled: true,
    icon: UserPlus,
  },
];

const funnelStepIcons: Record<string, React.ElementType> = {
  entrada: MessageCircle,
  classificacao: ClipboardCheck,
  encaminhamento: Target,
  processo: Workflow,
  transbordo: UserPlus,
};

const defaultFlowSteps: AgentFlowStep[] = funnelBuilderSteps.map(({ icon: _icon, ...step }) => step);

function normalizeFlowSteps(steps?: AgentFlowStep[] | unknown): AgentFlowStep[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return defaultFlowSteps.map((step) => ({ ...step }));
  }

  return steps
    .map((step, index) => {
      const item = step as Partial<AgentFlowStep>;
      return {
        id: String(item.id || `etapa-${index + 1}-${Date.now()}`),
        title: String(item.title || `Etapa ${index + 1}`),
        trigger: String(item.trigger || 'Defina o gatilho desta etapa.'),
        prompt: String(item.prompt || 'Defina o comportamento do agente nesta etapa.'),
        action: String(item.action || 'Registrar acao no CRM.'),
        enabled: item.enabled !== false,
      };
    })
    .filter((step) => step.title.trim());
}

const promptQuickBlocks = [
  {
    title: 'Triagem consultiva',
    text: 'Atue como assessor de gabinete: faça perguntas curtas, uma ou duas por vez, classifique antes de encaminhar e sempre conduza para a resolução da demanda.',
  },
  {
    title: 'Criar demanda',
    text: 'Sempre que identificar uma demanda do cidadão, crie ou atualize o registro, defina categoria, urgência, bairro, registre resumo, score, tags e próxima ação.',
  },
  {
    title: 'Encaminhamento',
    text: 'Encaminhe para o setor/secretaria competente quando houver classificação completa. Inclua contexto, dados do cidadão e urgência.',
  },
  {
    title: 'Transbordo humano',
    text: 'Transborde para assessor quando houver reunião, demanda sensível, documento, cidadão irritado, crise ou baixa confiança da IA.',
  },
];

const defaultHandoff = {
  reuniao_solicitada: true,
  demanda_sensivel: true,
  documento_enviado: true,
  demanda_urgente: true,
  cidadao_irritado: true,
  baixa_confianca: true,
  crise_detectada: true,
};

const emptyAgent: BuilderDraft = {
  name: '',
  role: 'Assessor de Atendimento Digital',
  channel: 'whatsapp',
  channels: ['whatsapp'],
  instances: [],
  is_active: true,
  status: 'Ativo',
  personality: '',
  instructions:
    'Atue como assessor de gabinete. Receba o cidadão, classifique a demanda, crie ou atualize o registro no CRM, mova a etapa correta do funil, encaminhe para o setor competente e acione o assessor humano com contexto completo quando necessário.',
  capabilities: ['Triagem de demandas', 'Kanban de atendimento', 'Encaminhamento', 'Agenda', 'Follow-up'],
  tools: ['whatsapp', 'kanban', 'crm', 'monitoramento', 'agenda', 'follow-up', 'notificar-assessor', 'mover-etapa-funil'],
  response_style: 'consultivo',
  autonomy_level: 2,
  operation_mode: 'Semiautônomo',
  channel_scope: 'Omnichannel CRM',
  handoff_rules: defaultHandoff,
  flow_steps: defaultFlowSteps,
};

const presets: TemplatePreset[] = [
  {
    name: 'Ana Atendimento 360',
    role: 'Triagem e Atendimento Completo',
    description: 'Atende no WhatsApp, classifica demandas, cria o registro no CRM, encaminha para setores e conduz o cidadão até a resolução.',
    tags: ['Triagem', 'CRM', 'Atendimento'],
    accent: 'from-emerald-600 to-slate-950',
    avatar: 'A',
    payload: {
      ...emptyAgent,
      name: 'Ana Atendimento 360',
      role: 'Triagem e Atendimento Completo',
      personality: 'Humana, objetiva e acolhedora. Conduz a conversa com empatia e foco na resolução da demanda.',
      instructions:
        'Atenda o cidadão como assessor de gabinete. Classifique a demanda, identifique categoria, urgência, bairro, dados de contato. Crie ou atualize o registro no CRM, mova o funil, gere follow-up, encaminhe para o setor competente e transborde para assessor com contexto completo quando necessário.',
      capabilities: ['Triagem de demandas', 'Kanban de atendimento', 'Encaminhamento', 'Agenda', 'Follow-up'],
      tools: ['whatsapp', 'kanban', 'crm', 'monitoramento', 'agenda', 'follow-up', 'notificar-assessor', 'mover-etapa-funil', 'criar-tarefa'],
      autonomy_level: 3,
      operation_mode: 'Autônomo',
    },
  },
  {
    name: 'Lia Classificação',
    role: 'Classificação de Demandas',
    description: 'Atende cidadãos, identifica tipo de demanda e cria registros qualificados no CRM.',
    tags: ['Classificação', 'Atendimento'],
    accent: 'from-slate-700 to-slate-950',
    avatar: 'L',
    payload: {
      ...emptyAgent,
      name: 'Lia Classificação',
      role: 'Classificação de Demandas',
      personality: 'Consultiva, objetiva e acolhedora. Faz perguntas curtas, humanas e orientadas à resolução.',
      instructions:
        'Descubra o motivo do contato, bairro, urgência, categoria da demanda e dados de contato. Atualize o registro sem parecer robótico e encaminhe para o setor quando houver classificação completa.',
      capabilities: ['Triagem de demandas', 'Kanban de atendimento', 'Encaminhamento', 'Follow-up'],
      tools: ['whatsapp', 'kanban', 'crm', 'monitoramento', 'follow-up', 'notificar-assessor', 'mover-etapa-funil'],
      autonomy_level: 3,
      operation_mode: 'Autônomo',
    },
  },
  {
    name: 'Nina Documentos',
    role: 'Análise Documental',
    description: 'Confere documentos, aponta pendências e sinaliza riscos para o time.',
    tags: ['Documentos', 'Checklists'],
    accent: 'from-slate-700 to-slate-950',
    avatar: 'N',
    payload: {
      ...emptyAgent,
      name: 'Nina Documentos',
      role: 'Análise Documental',
      personality: 'Precisa, calma e cuidadosa. Explica pendências com linguagem simples e segura.',
      instructions:
        'Classifique RG, CPF, comprovantes, documentos oficiais e anexos. Marque pendências e mova o card para Documentação.',
      capabilities: ['Documentação', 'Kanban de atendimento', 'Pós-atendimento'],
      tools: ['documentos', 'pdf-reader', 'kanban', 'crm', 'notificar-assessor', 'criar-tarefa'],
      autonomy_level: 2,
      operation_mode: 'Semiautônomo',
    },
  },
  {
    name: 'Theo Retorno',
    role: 'Follow-up e Reengajamento',
    description: 'Retoma conversas, agenda retornos e reduz demandas abandonadas.',
    tags: ['Follow-up', 'Reengajamento'],
    accent: 'from-amber-500 to-orange-500',
    avatar: 'T',
    payload: {
      ...emptyAgent,
      name: 'Theo Retorno',
      role: 'Follow-up e Reengajamento',
      response_style: 'curto',
      personality: 'Persistente sem ser invasivo. Direto, cordial e sempre orientado ao próximo passo.',
      instructions:
        'Detecte promessas de retorno, reuniões e prazos. Crie follow-ups e sugira mensagens curtas para retomar contato.',
      capabilities: ['Follow-up', 'Agenda', 'Kanban de atendimento'],
      tools: ['agenda', 'follow-up', 'whatsapp', 'crm', 'criar-tarefa', 'notificar-assessor'],
      autonomy_level: 2,
      operation_mode: 'Semiautônomo',
    },
  },
  {
    name: 'Marco Monitor',
    role: 'Monitoramento Territorial',
    description: 'Acompanha indicadores de bairros, demandas recorrentes e sentimento.',
    tags: ['Monitoramento', 'Território'],
    accent: 'from-slate-700 to-slate-950',
    avatar: 'M',
    payload: {
      ...emptyAgent,
      name: 'Marco Monitor',
      role: 'Monitoramento Territorial',
      personality: 'Analítico e atento. Identifica padrões e alerta sobre tendências.',
      instructions:
        'Analise demandas por bairro, categorias recorrentes, urgências e sentimento. Gere alertas quando houver anomalia.',
      capabilities: ['Monitoramento territorial', 'Kanban de atendimento', 'Encaminhamento'],
      tools: ['monitoramento', 'crm', 'kanban', 'whatsapp', 'mover-etapa-funil'],
      autonomy_level: 3,
      operation_mode: 'Autônomo',
    },
  },
  {
    name: 'Rita Reuniões',
    role: 'Agendamento de Atendimentos',
    description: 'Organiza agenda, confirma disponibilidade e prepara o assessor.',
    tags: ['Agenda', 'Reuniões'],
    accent: 'from-emerald-500 to-teal-500',
    avatar: 'R',
    payload: {
      ...emptyAgent,
      name: 'Rita Reuniões',
      role: 'Agendamento de Atendimentos',
      personality: 'Organizada, clara e prática. Confirma dados essenciais antes de acionar o assessor.',
      instructions:
        'Quando o cidadão pedir reunião, confirme motivo, dia, horário, participantes e canal de confirmação. Acione o assessor com resumo completo.',
      capabilities: ['Agenda', 'Triagem de demandas', 'Follow-up'],
      tools: ['agenda', 'whatsapp', 'crm', 'notificar-assessor', 'criar-tarefa'],
      autonomy_level: 2,
      operation_mode: 'Semiautônomo',
    },
  },
  {
    name: 'Clara Crises',
    role: 'Gestão de Crises',
    description: 'Identifica e conduz situações de crise com protocolos de resposta.',
    tags: ['Crises', 'Emergência'],
    accent: 'from-violet-600 to-purple-700',
    avatar: 'C',
    payload: {
      ...emptyAgent,
      name: 'Clara Crises',
      role: 'Gestão de Crises',
      response_style: 'premium',
      personality: 'Segura, calma e estratégica. Conduz com senso de urgência e discrição.',
      instructions:
        'Identifique sinais de crise (mídia negativa, denúncia, vulnerabilidade, scândalo), ative protocolo de crise, acione assessor imediatamente com contexto completo.',
      capabilities: ['Kanban de atendimento', 'Follow-up', 'Monitoramento territorial'],
      tools: ['whatsapp', 'kanban', 'crm', 'monitoramento', 'follow-up', 'notificar-assessor', 'mover-etapa-funil'],
      autonomy_level: 3,
      operation_mode: 'Autônomo',
    },
  },
  {
    name: 'Felipe Legislativo',
    role: 'Apoio Legislativo',
    description: 'Auxilia na elaboração e acompanhamento de projetos de lei e proposições.',
    tags: ['Legislativo', 'Projetos'],
    accent: 'from-blue-600 to-cyan-600',
    avatar: 'F',
    payload: {
      ...emptyAgent,
      name: 'Felipe Legislativo',
      role: 'Apoio Legislativo',
      personality: 'Técnico, preciso e fundamentado. Utiliza linguagem jurídica acessível.',
      instructions:
        'Auxilie na elaboração de projetos de lei, indicações, moções, ofícios e requerimentos. Verifique tramitação, prazos e status legislativo.',
      capabilities: ['Documentação', 'Kanban de atendimento', 'Agenda', 'Follow-up'],
      tools: ['whatsapp', 'kanban', 'crm', 'agenda', 'follow-up', 'notificar-assessor'],
      autonomy_level: 2,
      operation_mode: 'Semiautônomo',
    },
  },
  {
    name: 'Sofia Satisfação',
    role: 'Pós-Atendimento e Pesquisa',
    description: 'Acompanha cidadãos após resolução, mede satisfação e gera insights.',
    tags: ['Pós-atendimento', 'Pesquisa'],
    accent: 'from-pink-500 to-rose-500',
    avatar: 'S',
    payload: {
      ...emptyAgent,
      name: 'Sofia Satisfação',
      role: 'Pós-Atendimento e Pesquisa',
      personality: 'Acolhedora, grata e atenta. Mantém relacionamento duradouro com cidadãos.',
      instructions:
        'Após resolução, agende contato para avaliar satisfação, resolva pendências burocráticas, peça feedback e mantenha o relacionamento aquecido.',
      capabilities: ['Pós-atendimento', 'Follow-up', 'Agenda'],
      tools: ['whatsapp', 'crm', 'follow-up', 'agenda', 'criar-tarefa'],
      autonomy_level: 2,
      operation_mode: 'Semiautônomo',
    },
  },
  {
    name: 'Edu Comunicação',
    role: 'Comunicação e Marketing',
    description: 'Gera conteúdo, respostas e materiais de comunicação política.',
    tags: ['Comunicação', 'Marketing'],
    accent: 'from-stone-700 to-stone-950',
    avatar: 'E',
    payload: {
      ...emptyAgent,
      name: 'Edu Comunicação',
      role: 'Comunicação e Marketing',
      response_style: 'premium',
      personality: 'Criativo, persuasivo e conectado com o público. Domina comunicação política.',
      instructions:
        'Gere posts, legendas, discursos, pautas e materiais de comunicação. Adapte tom e linguagem para cada canal e audiência.',
      capabilities: ['Triagem de demandas', 'Kanban de atendimento'],
      tools: ['documentos', 'pdf-reader', 'kanban', 'crm', 'notificar-assessor', 'criar-tarefa'],
      autonomy_level: 2,
      operation_mode: 'Semiautônomo',
    },
  },
];

function normalizePreviewText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildPreviewDiagnostics(message: string) {
  const text = normalizePreviewText(message);
  const isVisit = /\b(reuniao|audiencia|encontrar|agendar|horario|visitar)\b/.test(text);
  const isUrgent = /\b(urgente|emergencia|critico|rapido|agora|socorro)\b/.test(text);
  const isComplaint = /\b(reclamacao|problema|reclamar|insatisfeito|errado|ruim)\b/.test(text);
  const isRequest = /\b(solicitacao|pedido|preciso|queria|gostaria|solicito)\b/.test(text);

  return {
    category: isUrgent ? 'Urgente' : isComplaint ? 'Reclamação' : isRequest ? 'Solicitação' : isVisit ? 'Reunião' : 'Triagem',
    priority: isUrgent ? 'Alta' : isComplaint ? 'Normal' : 'Normal',
    temperature: isUrgent || isComplaint ? 'Quente' : isRequest || isVisit ? 'Morno' : 'Inicial',
    nextAction: isVisit ? 'Agendar reunião' : isUrgent ? 'Encaminhar urgente' : 'Classificar demanda',
  };
}

function buildDraftAgentReply(draft: BuilderDraft, message: string) {
  const diagnostics = buildPreviewDiagnostics(message);
  const agentName = draft.name || 'Agente';
  const style = draft.response_style || 'consultivo';
  const intro = style === 'curto'
    ? 'Perfeito.'
    : `Perfeito, aqui e ${agentName}.`;

  if (diagnostics.category === 'Reunião') {
    return `${intro} Para agendar a reunião, me confirme o motivo, melhor dia/horário e se voce prefere atendimento por WhatsApp ou ligacao.`;
  }

  if (diagnostics.priority === 'Alta') {
    return `${intro} Entendi que e urgente. Vou priorizar e encaminhar imediatamente. Qual seu nome completo e bairro?`;
  }

  return `${intro} Entendi sua demanda. Qual bairro, categoria e seus dados de contato para podermos acompanhar?`;
}

function buildLeadSimulatorReply(draft: BuilderDraft, message: string, history: TestMessage[]) {
  const text = normalizePreviewText(message);
  const diagnostics = buildPreviewDiagnostics(message);
  const cidadaoTurns = history.filter((item) => item.side === 'cidadao').length;
  const agentName = draft.name || 'assessor';

  if (/\b(reuniao|agendar|horario|encontrar)\b/.test(text)) {
    return 'Posso sim. Tenho disponibilidade no fim da tarde ou sabado de manha. Qual horário fica melhor?';
  }

  if (/\b(urgente|rapido|emergencia|critico)\b/.test(text)) {
    return 'E uma situação que precisa de atenção rapida. Tem como encaminhar para o setor responsável?';
  }

  if (/\b(bairro|regiao|cidade|localizacao)\b/.test(text)) {
    return diagnostics.category !== 'Triagem'
      ? `Minha região e ${diagnostics.category}, mas posso ver opções próximas se forem acessíveis.`
      : 'Prefiro uma região com boa estrutura. Ainda estou aberto a opções próximas.';
  }

  if (/\b(valor|orcamento|preco|custo)\b/.test(text)) {
    return 'Ainda estou ajustando o orcamento, mas queria entender melhor o processo e os prazos.';
  }

  if (cidadaoTurns === 0) {
    return `Oi, ${agentName}. Tenho uma demanda e queria entender como funciona o atendimento do gabinete.`;
  }

  return 'Entendi. Pode me mandar mais informações sobre prazo, responsável e próximos passos? Quero acompanhar.';
}

async function simulateLeadReply(draft: BuilderDraft, brokerMessage: string, history: TestMessage[]) {
  const systemInstruction = [
    'Voce simula um cidadao brasileiro real em um chat de validacao de CRM de gabinete politico.',
    'Responda sempre como cidadao, nunca como assistente ou assessor.',
    'Use mensagens naturais, curtas e com variacoes de demanda, duvidas, objecoes e informacoes pessoais.',
    'Nao use markdown, nao explique o teste e nao ofereca recursos do sistema.',
  ].join(' ');

  const prompt = JSON.stringify({
    agent_under_test: {
      name: draft.name || 'Agente',
      role: draft.role || 'Atendimento de gabinete',
      style: draft.response_style || 'consultivo',
      channels: draft.channels || [draft.channel || 'whatsapp'],
      instructions: draft.instructions || '',
    },
    conversation: history.slice(-10).map((item) => ({
      role: item.side === 'agent' ? 'agent' : 'cidadao',
      content: item.content,
    })),
    broker_message: brokerMessage,
    task: 'Continue a conversa respondendo apenas como o cidadao.',
  });

  try {
    const data = await callApi('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, systemInstruction, temperature: 0.85 }),
    });
    const text = String(data?.text || '').trim();
    return text || buildLeadSimulatorReply(draft, brokerMessage, history);
  } catch {
    return buildLeadSimulatorReply(draft, brokerMessage, history);
  }
}

const AIAgents: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [whatsAppInstances, setWhatsAppInstances] = useState<WhatsAppInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('new');
  const [draft, setDraft] = useState<BuilderDraft>(emptyAgent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [testMode, setTestMode] = useState<TestMode>('cidadao-simulator');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<TestMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(() => `agent-preview-${Date.now()}`);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [ratingInput, setRatingInput] = useState(0);
  const [feedbackInput, setFeedbackInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const { pathname } = useLocation();

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedId),
    [agents, selectedId]
  );

  const activeAgents = useMemo(() => agents.filter((agent) => agent.is_active).length, [agents]);
  const pausedAgents = useMemo(() => agents.length - activeAgents, [agents, activeAgents]);
  const connectedWhatsAppInstances = useMemo(
    () => whatsAppInstances.filter((instance) => instance.status === 'connected').length,
    [whatsAppInstances]
  );
  const selectedWhatsAppInstance = useMemo(
    () => whatsAppInstances.find((instance) => instance.id === draft.instances?.[0]),
    [draft.instances, whatsAppInstances]
  );
  const propertyPath = pathname.startsWith('/gabinete') ? '/gabinete/demandas/new' : '/gabinete/demandas/new';
  const brainTabIndex = 5;
  const activeStepIndex = Math.max(tabs.findIndex((tab) => tab.id === activeTab), 0);
  const activeStep = tabs[activeStepIndex] || tabs[0];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === tabs.length - 1;
  const lastLeadMessage =
    [...chatMessages].reverse().find((message) => message.side === 'cidadao')?.content ||
    chatMessages[chatMessages.length - 1]?.content ||
    '';
  const previewDiagnostics = useMemo(() => buildPreviewDiagnostics(lastLeadMessage), [lastLeadMessage]);
  const currentFlowSteps = useMemo(() => normalizeFlowSteps(draft.flow_steps), [draft.flow_steps]);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      const agent = selectedAgent as AIAgent & BuilderDraft;
      setDraft({
        name: agent.name,
        role: agent.role,
        channel: agent.channel || 'whatsapp',
        channels: agent.channels?.length ? agent.channels : [agent.channel || 'whatsapp'],
        instances: agent.instances?.length ? agent.instances : [],
        is_active: agent.is_active,
        status: agent.status || (agent.is_active ? 'Ativo' : 'Pausado'),
        personality: agent.personality || '',
        instructions: agent.instructions || '',
        capabilities: agent.capabilities?.length ? agent.capabilities : emptyAgent.capabilities,
        tools: agent.tools?.length ? agent.tools : emptyAgent.tools,
        response_style: agent.response_style || 'consultivo',
        autonomy_level: agent.autonomy_level || 2,
        operation_mode: agent.operation_mode || 'Semiautônomo',
        channel_scope: agent.channel_scope || 'Omnichannel CRM',
        handoff_rules: {
          ...defaultHandoff,
          ...(agent.handoff_rules || {}),
        },
        flow_steps: normalizeFlowSteps(agent.flow_steps),
      });
      return;
    }

    setDraft(emptyAgent);
  }, [selectedAgent]);

  useEffect(() => {
    if (selectedAgent) {
      loadMetrics(selectedAgent.id);
    } else {
      setMetrics(null);
    }
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, chatLoading]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const [loadedAgents] = await Promise.all([
        aiAgentService.list(),
        loadWhatsAppInstances(),
      ]);
      setAgents(loadedAgents);
    } catch (error: any) {
      toast.error('Erro ao carregar agentes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWhatsAppInstances = async () => {
    try {
      setInstancesLoading(true);
      const instances = await instanceApi.list();
      setWhatsAppInstances(instances);
      return instances;
    } catch {
      setWhatsAppInstances([]);
      toast.error('Nao foi possivel carregar as instancias do WhatsApp.');
      return [];
    } finally {
      setInstancesLoading(false);
    }
  };

  const loadMetrics = async (agentId: string) => {
    try {
      setMetricsLoading(true);
      const data = await aiAgentService.metrics(agentId);
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleQualify = async () => {
    if (!selectedAgent || ratingInput === 0) {
      toast.error('Selecione uma nota (1-5) para qualificar.');
      return;
    }
    try {
      await aiAgentService.qualify(selectedAgent.id, {
        rating: ratingInput,
        feedback: feedbackInput,
      });
      toast.success('Qualificação registrada! Isso ajuda o cerebro neural do agente.');
      setRatingInput(0);
      setFeedbackInput('');
      await loadMetrics(selectedAgent.id);
    } catch (error: any) {
      toast.error('Erro ao qualificar: ' + error.message);
    }
  };

  const goToStep = (id: string) => {
    setActiveTab(id);
  };

  const goToPreviousStep = () => {
    if (isFirstStep) return;
    setActiveTab(tabs[activeStepIndex - 1].id);
  };

  const goToNextStep = () => {
    if (isLastStep) return;
    setActiveTab(tabs[activeStepIndex + 1].id);
  };

  const startBlankAgent = () => {
    setSelectedId('new');
    setDraft({
      ...emptyAgent,
      name: '',
      personality: '',
      instructions: '',
      flow_steps: defaultFlowSteps.map((step) => ({ ...step })),
    });
    setActiveTab('identity');
  };

  const usePreset = (preset: TemplatePreset) => {
    setSelectedId('new');
    setDraft({
      ...emptyAgent,
      ...preset.payload,
      handoff_rules: {
        ...defaultHandoff,
        ...(preset.payload.handoff_rules || {}),
      },
      flow_steps: normalizeFlowSteps(preset.payload.flow_steps),
    });
    setActiveTab('identity');
    toast.success(`${preset.name} carregado como modelo.`);
  };

  const toggleListValue = (field: 'capabilities' | 'tools', value: string) => {
    const current = draft[field] || [];
    setDraft({
      ...draft,
      [field]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };

  const toggleChannel = (value: string) => {
    const current = draft.channels || [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    const safeNext = next.length ? next : ['whatsapp'];
    setDraft({
      ...draft,
      channels: safeNext,
      channel: safeNext[0],
    });
  };

  const toggleHandoffRule = (ruleId: string) => {
    setDraft({
      ...draft,
      handoff_rules: {
        ...(draft.handoff_rules || {}),
        [ruleId]: !(draft.handoff_rules || {})[ruleId],
      },
    });
  };

  const appendPromptBlock = (text: string) => {
    const current = String(draft.instructions || '').trim();
    setDraft({
      ...draft,
      instructions: current ? `${current}\n\n${text}` : text,
    });
  };

  const setFlowSteps = (steps: AgentFlowStep[]) => {
    setDraft({
      ...draft,
      flow_steps: normalizeFlowSteps(steps),
    });
  };

  const updateFlowStep = (stepId: string, field: keyof AgentFlowStep, value: string | boolean) => {
    setFlowSteps(
      currentFlowSteps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              [field]: value,
            }
          : step
      )
    );
  };

  const moveFlowStep = (stepId: string, direction: -1 | 1) => {
    const index = currentFlowSteps.findIndex((step) => step.id === stepId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentFlowSteps.length) return;
    const next = [...currentFlowSteps];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setFlowSteps(next);
  };

  const removeFlowStep = (stepId: string) => {
    if (currentFlowSteps.length <= 1) {
      toast.error('O agente precisa ter pelo menos uma etapa no funil.');
      return;
    }
    setFlowSteps(currentFlowSteps.filter((step) => step.id !== stepId));
  };

  const addFlowStep = () => {
    setFlowSteps([
      ...currentFlowSteps,
      {
        id: `etapa-${Date.now()}`,
        title: 'Nova etapa',
        trigger: 'Defina quando o agente deve entrar nesta etapa.',
        prompt: 'Explique o que o agente deve perguntar, responder ou validar aqui.',
        action: 'Registrar resumo e proxima acao no CRM.',
        enabled: true,
      },
    ]);
  };

  const resetDraft = () => {
    if (selectedAgent) {
      const agent = selectedAgent as AIAgent & BuilderDraft;
      setDraft({
        ...emptyAgent,
        ...agent,
        channels: agent.channels?.length ? agent.channels : [agent.channel || 'whatsapp'],
        instances: agent.instances?.length ? agent.instances : [],
        handoff_rules: {
          ...defaultHandoff,
          ...(agent.handoff_rules || {}),
        },
        flow_steps: normalizeFlowSteps(agent.flow_steps),
      });
      return;
    }
    startBlankAgent();
  };

  const saveAgent = async (statusOverride?: string) => {
    const nextStatus = statusOverride || draft.status || 'Ativo';

    if (!draft.name || !draft.role) {
      toast.error('Informe nome e função do agente.');
      return;
    }

    const payload: BuilderDraft = {
      ...draft,
      status: nextStatus,
      is_active: nextStatus === 'Ativo' || nextStatus === 'Em teste',
      channel: draft.channels?.[0] || draft.channel || 'whatsapp',
      operation_mode:
        autonomyLevels.find((level) => level.id === Number(draft.autonomy_level || 2))?.label ||
        draft.operation_mode,
      handoff: {
        triggers: Object.entries(draft.handoff_rules || {})
          .filter(([, enabled]) => Boolean(enabled))
          .map(([key]) => key),
      },
      flow_steps: currentFlowSteps,
    };

    try {
      setSaving(true);
      if (selectedAgent) {
        await aiAgentService.update(selectedAgent.id, payload);
        toast.success(statusOverride === 'Rascunho' ? 'Rascunho salvo.' : 'Agente atualizado.');
      } else {
        const created = await aiAgentService.create(payload);
        setSelectedId(created.id);
        toast.success(statusOverride === 'Rascunho' ? 'Rascunho criado.' : 'Agente publicado.');
      }
      await loadAgents();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAgent = async () => {
    if (!selectedAgent || !confirm(`Excluir o agente "${selectedAgent.name}"?`)) return;
    await aiAgentService.remove(selectedAgent.id);
    setSelectedId('new');
    await loadAgents();
    toast.success('Agente removido.');
  };

  const runTest = async (messageOverride?: string) => {
    const message = (messageOverride || chatInput).trim();
    if (!message) {
      toast.error('Digite uma mensagem para iniciar a conversa.');
      return;
    }

    const outgoingMessage: TestMessage = {
      id: `${testMode === 'cidadao-simulator' ? 'agent' : 'cidadao'}-${Date.now()}`,
      side: testMode === 'cidadao-simulator' ? 'agent' : 'cidadao',
      content: message,
    };
    const nextHistory = [...chatMessages, outgoingMessage];

    setChatMessages(nextHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      let reply = '';
      let replySide: TestMessage['side'] = 'agent';
      let successMessage = 'Resposta gerada.';

      if (testMode === 'cidadao-simulator') {
        replySide = 'cidadao';
        reply = await simulateLeadReply(draft, message, nextHistory);
        successMessage = 'Lead simulado respondeu.';
      } else if (selectedAgent) {
        const response = await aiAgentService.chat(selectedAgent.id, message, chatSessionId);
        reply = response.message;
        successMessage = 'Resposta real do agente recebida.';
      } else {
        reply = buildDraftAgentReply(draft, message);
        successMessage = 'Resposta simulada do rascunho gerada.';
      }

      setChatMessages((current) => [
        ...current,
        {
          id: `${replySide}-${Date.now()}`,
          side: replySide,
          content: reply || 'Nao consegui responder agora. Ajuste a mensagem e tente novamente.',
        },
      ]);

      toast.success(successMessage);
    } catch (error: any) {
      toast.error('Erro ao conversar no teste: ' + error.message);
      setChatMessages((current) => [
        ...current,
        {
          id: `${testMode === 'cidadao-simulator' ? 'cidadao' : 'agent'}-error-${Date.now()}`,
          side: testMode === 'cidadao-simulator' ? 'cidadao' : 'agent',
          content: 'Nao consegui conectar a IA agora. Ajuste a mensagem ou tente novamente em instantes.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const resetChat = () => {
    setChatSessionId(`agent-preview-${Date.now()}`);
    setChatInput('');
    setChatMessages([]);
  };
  if (loading) {
    return (
      <div className="min-h-[540px] bg-[#F5F7FB] -m-3 sm:-m-4 md:-m-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-bold">
          <Loader2 className="animate-spin text-emerald-600" size={22} />
          Carregando Central de Agentes
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F7FB] -m-2 sm:-m-3 md:-m-4 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="h-auto min-h-16 px-3 py-3 sm:px-4 lg:px-5 flex flex-col gap-3 xl:h-20 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-slate-950 flex items-center justify-center shadow-sm">
              <Home className="text-emerald-400" size={21} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black tracking-tight leading-none">PIOS</div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mt-1 truncate">
                Imobiliária Tradicional
              </div>

            </div>
          </div>

          <div className="relative flex-1 max-w-2xl xl:mx-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full h-11 rounded-lg border border-slate-200 bg-[#F8FAFD] pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="Buscar demandas, cidadãos, agentes..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={propertyPath}
              className="h-11 px-4 rounded-lg bg-emerald-600 text-white text-sm font-black flex items-center gap-2 shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <Plus size={18} />
              Nova demanda
            </Link>
            <button
              onClick={startBlankAgent}
              className="h-11 px-4 rounded-lg bg-slate-950 text-white text-sm font-black flex items-center gap-2 shadow-sm hover:bg-slate-800"
            >
              <Bot size={18} />
              Novo agente
            </button>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-slate-950 flex items-center justify-center shadow-sm">
              <Home className="text-emerald-400" size={21} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black tracking-tight leading-none">PIOS</div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mt-1 truncate">
                Imobiliária Tradicional
              </div>

            </div>
          </div>

          <div className="relative flex-1 max-w-2xl xl:mx-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full h-11 rounded-lg border border-slate-200 bg-[#F8FAFD] pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="Buscar demandas, cidadãos, agentes..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={propertyPath}
              className="h-11 px-4 rounded-lg bg-emerald-600 text-white text-sm font-black flex items-center gap-2 shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <Plus size={18} />
              Nova demanda
            </Link>
            <button
              onClick={startBlankAgent}
              className="h-11 px-4 rounded-lg bg-slate-950 text-white text-sm font-black flex items-center gap-2 shadow-sm hover:bg-slate-800"
            >
              <Bot size={18} />
              Novo agente
            </button>
          </div>
        </div>
      </header>

      <div className="p-2 sm:p-3 lg:p-4 2xl:p-5 flex flex-col gap-5 w-full">
        {/* Top Section: Central de Agentes */}
        <section className="rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm overflow-hidden w-full">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Central de Agentes</div>
                  <h2 className="mt-2 text-xl font-black tracking-tight mb-0">Modelos e operação</h2>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <WandSparkles size={20} />
                </div>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
              <SidebarItem icon={Sparkles} label="Templates prontos" count={presets.length} active />
              <SidebarItem icon={Activity} label="Agentes ativos" count={activeAgents} />
              <SidebarItem icon={Circle} label="Agentes pausados" count={pausedAgents} />
              <SidebarItem icon={BookOpen} label="Biblioteca de prompts" />
              <SidebarItem icon={ShieldCheck} label="Regras globais" />
              <SidebarItem icon={FileText} label="Logs de execução" />
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
              {presets.map((preset) => (
                <article key={preset.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-3">
                    <Avatar label={preset.avatar} gradient={preset.accent} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-950 mb-0 truncate">{preset.name}</h3>
                      <p className="text-[11px] font-bold text-slate-500 mb-0">{preset.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 mb-0">{preset.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {preset.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => usePreset(preset)}
                    className="mt-3 h-9 w-full rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-100"
                  >
                    Usar modelo
                  </button>
                </article>
              ))}
            </div>

            {agents.length > 0 && (
              <div className="border-t border-slate-100 p-4 pt-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">Agentes salvos</div>
                  <div className="flex gap-2 overflow-x-auto">
                    {agents.slice(0, 5).map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedId(agent.id)}
                        className={`min-w-52 rounded-lg border px-3 py-2 text-left transition ${
                          selectedId === agent.id ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-black">{agent.name}</span>
                          <span className={`h-2 w-2 rounded-full ${agent.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 truncate">{agent.role}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Bottom Section: Construtor */}
          <section className="min-w-0 space-y-5 w-full">
            <section className="rounded-lg border border-slate-200 bg-white p-5 lg:p-7 shadow-sm">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-5xl">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">
                    <Sparkles size={15} />
                    IA e Automação
                  </div>
                  <h1 className="mt-4 text-3xl lg:text-4xl font-black tracking-tight text-slate-950 mb-0">
                    Construtor de Agente Autônomo
                  </h1>
                  <p className="mt-3 max-w-5xl text-sm lg:text-base font-medium leading-relaxed text-slate-600 mb-0">
                    Configure agentes que atendem, classificam, analisam documentos, movimentam demandas no Kanban e executam follow-ups automaticamente.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <StatusPill status={draft.status || (draft.is_active ? 'Ativo' : 'Pausado')} />
                  {selectedAgent && (
                    <button
                      onClick={removeAgent}
                      className="h-10 px-3 rounded-lg border border-red-100 bg-red-50 text-red-600 font-black text-xs flex items-center gap-2 hover:bg-red-100"
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </section>
            
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-7">
                {flowSteps.map((step, index) => (
                  <div key={step.title} className="relative rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <step.icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-950 mb-0 truncate">{step.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 mb-0 truncate">{step.subtitle}</p>
                      </div>
                    </div>
                    {index < flowSteps.length - 1 && (
                      <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300 bg-white rounded-full" size={18} />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-white p-3">
                <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Etapa {activeStepIndex + 1} de {tabs.length}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950">
                      <activeStep.icon size={16} />
                      {activeStep.label}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 lg:w-56">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${((activeStepIndex + 1) / tabs.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => goToStep(tab.id)}
                      aria-selected={activeTab === tab.id}
                      className={`h-11 min-w-0 rounded-lg px-3 text-xs font-black flex items-center justify-center gap-2 transition ${
                        activeTab === tab.id
                          ? 'bg-slate-100 text-slate-950'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <tab.icon size={15} className="shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 lg:p-6 min-h-[520px]">
                <section id="agent-identity" className={activeTab === 'identity' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Perfil do agente"
                    title="Missao e postura de atendimento"
                    description="Defina nome, função, estilo de atendimento, status e instruções operacionais."
                  />
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Field label="Nome do agente">
                      <input
                        value={draft.name || ''}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className="agent-input"
                        placeholder="Ex.: Lia Qualificação"
                      />
                    </Field>
                    <Field label="Função operacional">
                      <input
                        value={draft.role || ''}
                        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                        className="agent-input"
                        placeholder="Ex.: SDR e Atendimento Completo"
                      />
                    </Field>
                    <Field label="Estilo de atendimento">
                      <select
                        value={draft.response_style || 'consultivo'}
                        onChange={(e) => setDraft({ ...draft, response_style: e.target.value })}
                        className="agent-input"
                      >
                        <option value="consultivo">Consultivo</option>
                        <option value="curto">Curto e direto</option>
                        <option value="tecnico">Técnico</option>
                        <option value="premium">Premium</option>
                      </select>
                    </Field>
                    <Field label="Status">
                      <div className="relative">
                        <select
                          value={draft.status || 'Ativo'}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              status: e.target.value,
                              is_active: e.target.value === 'Ativo' || e.target.value === 'Em teste',
                            })
                          }
                          className="agent-input appearance-none pr-10"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Em teste">Em teste</option>
                          <option value="Rascunho">Rascunho</option>
                          <option value="Pausado">Pausado</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      </div>
                    </Field>
                    <Field label="Personalidade">
                      <textarea
                        value={draft.personality || ''}
                        onChange={(e) => setDraft({ ...draft, personality: e.target.value })}
                        className="agent-input min-h-28 resize-none"
                        placeholder="Como o agente deve se apresentar, tom de voz, empatia e postura comercial."
                      />
                    </Field>
                    <Field label="Instruções operacionais">
                      <textarea
                        value={draft.instructions || ''}
                        onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                        className="agent-input min-h-28 resize-none"
                        placeholder="Transbordo, boas práticas, limites e contexto do gabinete."
                      />
                    </Field>
                  </div>
                </section>

                <section id="agent-channels" className={activeTab === 'channels' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Canais"
                    title="Canais de atuação e WhatsApp conectado"
                    description="Escolha onde o agente pode conversar e vincule a operação a uma instância real do WhatsApp."
                  />
                  <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {channels.map((channel) => (
                          <button
                            key={channel.id}
                            onClick={() => toggleChannel(channel.id)}
                            className={`h-12 rounded-lg border px-3 text-sm font-black transition ${
                              (draft.channels || []).includes(channel.id)
                                ? 'border-slate-300 bg-slate-100 text-slate-950'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {channel.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Instancia WhatsApp
                        </label>
                        <button
                          type="button"
                          onClick={loadWhatsAppInstances}
                          disabled={instancesLoading}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {instancesLoading ? 'Atualizando...' : 'Atualizar'}
                        </button>
                      </div>
                      <select
                        value={draft.instances?.[0] || ''}
                        onChange={(e) => setDraft({ ...draft, instances: e.target.value ? [e.target.value] : [] })}
                        className="agent-input"
                      >
                        <option value="">Todas as instancias conectadas</option>
                        {whatsAppInstances.map((instance) => (
                          <option key={instance.id} value={instance.id}>
                            {instance.name} - {instance.status === 'connected' ? 'conectada' : 'desconectada'}
                          </option>
                        ))}
                      </select>
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                          <Smartphone size={15} className={connectedWhatsAppInstances ? 'text-emerald-600' : 'text-amber-600'} />
                          {connectedWhatsAppInstances} de {whatsAppInstances.length} conectada(s)
                        </div>
                        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500 mb-0">
                          {selectedWhatsAppInstance
                            ? `Este agente atende pela instancia ${selectedWhatsAppInstance.name}.`
                            : 'Sem instancia fixa: o agente pode atender qualquer WhatsApp conectado da organizacao.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="agent-prompt" className={activeTab === 'prompt' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Prompt e funil"
                    title="Construtor tipo Typebot"
                    description="Monte o roteiro de atendimento que o agente vai seguir: entrada, qualificacao, match, processo e transbordo."
                  />

                  <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-950 mb-0">Fluxo de atendimento</h3>
                          <p className="mt-1 text-xs font-semibold text-slate-500 mb-0">
                            Cada bloco representa uma etapa que o agente deve executar durante a conversa.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addFlowStep}
                          className="h-9 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-[11px] font-black text-emerald-700 hover:bg-emerald-100"
                        >
                          + Adicionar bloco
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {currentFlowSteps.map((step, index) => {
                          const StepIcon = funnelStepIcons[step.id] || Workflow;
                          return (
                          <div key={step.id} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                              <div className="flex items-center gap-3 lg:w-56">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${step.enabled === false ? 'bg-slate-200 text-slate-500' : 'bg-slate-950 text-white'}`}>
                                  <StepIcon size={18} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                                    Bloco {index + 1}
                                  </div>
                                  <input
                                    value={step.title}
                                    onChange={(e) => updateFlowStep(step.id, 'title', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-black text-slate-950 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                              <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Gatilho</div>
                                  <textarea
                                    value={step.trigger}
                                    onChange={(e) => updateFlowStep(step.id, 'trigger', e.target.value)}
                                    className="mt-1 min-h-[78px] w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-xs font-semibold leading-relaxed text-slate-700 outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Prompt</div>
                                  <textarea
                                    value={step.prompt}
                                    onChange={(e) => updateFlowStep(step.id, 'prompt', e.target.value)}
                                    className="mt-1 min-h-[78px] w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-xs font-semibold leading-relaxed text-slate-700 outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Acao no CRM</div>
                                  <textarea
                                    value={step.action}
                                    onChange={(e) => updateFlowStep(step.id, 'action', e.target.value)}
                                    className="mt-1 min-h-[78px] w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-xs font-semibold leading-relaxed text-slate-700 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                              <label className="inline-flex items-center gap-2 text-xs font-black text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={step.enabled !== false}
                                  onChange={(e) => updateFlowStep(step.id, 'enabled', e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                Etapa ativa
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveFlowStep(step.id, -1)}
                                  disabled={index === 0}
                                  className="h-8 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                  Subir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveFlowStep(step.id, 1)}
                                  disabled={index === currentFlowSteps.length - 1}
                                  className="h-8 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                  Descer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFlowStep(step.id)}
                                  className="h-8 rounded-md border border-red-100 bg-white px-3 text-[11px] font-black text-red-600 hover:bg-red-50"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                            {index < currentFlowSteps.length - 1 && (
                              <div className="absolute -bottom-3 left-8 hidden h-6 w-px bg-slate-300 lg:block" />
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                          <MessageSquareText size={15} />
                          Prompt mestre
                        </div>
                        <textarea
                          value={draft.instructions || ''}
                          onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                          className="mt-3 min-h-[300px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-relaxed text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                          placeholder="Descreva como o agente deve atender, classificar, criar demanda, encaminhar e transbordar para o assessor."
                        />
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-black text-slate-950 mb-0">Blocos rapidos de prompt</h3>
                        <div className="mt-3 space-y-2">
                          {promptQuickBlocks.map((block) => (
                            <button
                              key={block.title}
                              type="button"
                              onClick={() => appendPromptBlock(block.text)}
                              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                            >
                              <div className="text-xs font-black text-slate-950">{block.title}</div>
                              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500 mb-0">{block.text}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="agent-operation" className={activeTab === 'operation' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Operação"
                    title="Jornada que este agente conduz"
                    description="Selecione os processos em que o agente poderá agir dentro da operação do gabinete."
                  />
                  <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-5">
                    {salesProcessSteps.map((step, index) => (
                      <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                            <step.icon size={18} />
                          </div>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                            {index + 1}
                          </span>
                        </div>
                        <h3 className="mt-3 text-sm font-black text-slate-950 mb-0">{step.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 mb-0">{step.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {operatingModes.map((mode) => (
                      <button
                        key={mode.title}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            role: mode.title,
                            tools: Array.from(new Set([...(draft.tools || []), ...mode.tools])),
                            capabilities: Array.from(new Set([...(draft.capabilities || []), 'Atendimento inicial', 'Kanban comercial', 'Follow-up'])),
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                      >
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                          <Workflow size={15} />
                          Modo operacional
                        </div>
                        <h3 className="mt-2 text-sm font-black text-slate-950 mb-0">{mode.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 mb-0">{mode.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {mode.tools.slice(0, 4).map((tool) => (
                            <span key={tool} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-600">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-7">
                    <SectionHeading
                      eyebrow="Escopo"
                      title="Processos liberados"
                      description="Escolha quais partes do atendimento e da venda este agente pode executar."
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => toggleListValue('capabilities', workspace.id)}
                        className={`rounded-lg border p-4 text-left transition ${
                          (draft.capabilities || []).includes(workspace.id)
                            ? 'border-slate-300 bg-slate-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            (draft.capabilities || []).includes(workspace.id)
                              ? 'bg-slate-950 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <workspace.icon size={18} />
                          </div>
                          {(draft.capabilities || []).includes(workspace.id) && <CheckCircle2 size={18} className="text-slate-900" />}
                        </div>
                        <h3 className="mt-3 text-sm font-black text-slate-950 mb-0">{workspace.label}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 mb-0">{workspace.description}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-7">
                    <SectionHeading
                      eyebrow="Nível de autonomia"
                      title="Defina até onde a IA pode executar"
                      description="O nível controla se o agente apenas sugere, executa tarefas simples ou opera com autonomia."
                    />
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {autonomyLevels.map((level) => (
                        <button
                          key={level.id}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              autonomy_level: level.id,
                              operation_mode: level.label,
                            })
                          }
                          className={`rounded-lg border p-4 text-left transition ${
                            Number(draft.autonomy_level || 2) === level.id
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              Number(draft.autonomy_level || 2) === level.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <level.icon size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-950 mb-0">{level.label}</h3>
                              <p className="text-[11px] font-bold text-slate-500 mb-0">Nível {level.id}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-600 mb-0">{level.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section id="agent-tools" className={activeTab === 'tools' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Acoes permitidas"
                    title="O que o agente pode fazer sozinho"
                    description="Ative consultas e execuções: CRM, Kanban, monitoramento, agenda, tarefas e notificação ao assessor."
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {toolOptions.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => toggleListValue('tools', tool.id)}
                        className={`h-10 rounded-lg border px-3 text-xs font-black flex items-center gap-2 transition ${
                          (draft.tools || []).includes(tool.id)
                            ? 'border-slate-300 bg-slate-100 text-slate-950'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <tool.icon size={15} />
                        {tool.label}
                        {(draft.tools || []).includes(tool.id) && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </section>

                <section id="agent-rules" className={activeTab === 'rules' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Transbordo"
                    title="Quando transbordar para o assessor?"
                    description="Determine os sinais de risco, demanda sensível ou alta urgência que devem transbordar para um assessor."
                  />
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {handoffRules.map((rule) => (
                      <label
                        key={rule.id}
                        className={`rounded-lg border p-4 flex items-center gap-3 cursor-pointer transition ${
                          (draft.handoff_rules || {})[rule.id]
                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-amber-500"
                          checked={Boolean((draft.handoff_rules || {})[rule.id])}
                          onChange={() => toggleHandoffRule(rule.id)}
                        />
                        <span className="text-sm font-black">{rule.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section id="agent-brain" className={activeTab === 'brain' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Aprendizado operacional"
                    title="Qualificação e aprendizado do agente"
                    description="Acompanhe metricas, avalie respostas e treine o agente para melhorar continuamente."
                  />

                  {selectedAgent ? (
                    <>
                      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <Brain size={18} className="text-slate-700" />
                          <div className="mt-2 text-2xl font-black text-slate-950">
                            {metricsLoading ? '-' : metrics?.total_conversations || 0}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Conversas</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <Star size={18} className="text-amber-500" />
                          <div className="mt-2 text-2xl font-black text-slate-950">
                            {metricsLoading ? '-' : metrics?.average_rating ? metrics.average_rating.toFixed(1) : '-'}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Media avaliações</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <Target size={18} className="text-emerald-600" />
                          <div className="mt-2 text-2xl font-black text-slate-950">
                            {metricsLoading ? '-' : metrics?.total_qualifications || 0}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Qualificações</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <TrendingUp size={18} className="text-blue-600" />
                          <div className="mt-2 text-2xl font-black text-slate-950">
                            {metricsLoading ? '-' : metrics?.rating_distribution?.[5] || 0}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Notas 5</div>
                        </div>
                      </div>

                      {metrics && metrics.total_qualifications > 0 && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 mb-3">
                            Distribuição de notas
                          </div>
                          <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const count = metrics.rating_distribution?.[star] || 0;
                              const total = metrics.total_qualifications || 1;
                              const pct = (count / total) * 100;
                              return (
                                <div key={star} className="flex items-center gap-3">
                                  <span className="w-4 text-xs font-bold text-slate-600">{star}</span>
                                  <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-amber-500 transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="w-8 text-xs font-bold text-slate-500 text-right">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 rounded-lg border border-amber-100 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 text-amber-800">
                          <Star size={16} />
                          <span className="text-xs font-black uppercase tracking-[0.14em]">Qualificar este agente</span>
                        </div>
                        <p className="mt-1 text-xs text-amber-700">
                          Sua avaliação ajuda o cerebro neural do agente a aprender e melhorar.
                        </p>
                        <div className="mt-3 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRatingInput(star)}
                              className={`h-10 w-10 rounded-lg border flex items-center justify-center transition ${
                                star <= ratingInput
                                  ? 'border-amber-300 bg-amber-200 text-amber-800'
                                  : 'border-slate-200 bg-white text-slate-400 hover:bg-amber-50'
                              }`}
                            >
                              <Star size={18} fill={star <= ratingInput ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          className="mt-3 w-full rounded-lg border border-amber-200 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 resize-none"
                          placeholder="Feedback opcional - o que o agente fez bem ou poderia melhorar?"
                          rows={2}
                        />
                        <button
                          onClick={handleQualify}
                          disabled={ratingInput === 0}
                          className="mt-3 h-10 rounded-lg bg-amber-600 px-4 text-sm font-black text-white flex items-center gap-2 hover:bg-amber-700 disabled:opacity-50"
                        >
                          <Star size={15} />
                          Registrar qualificação
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                      <Brain size={32} className="mx-auto text-slate-400" />
                      <p className="mt-3 text-sm font-bold text-slate-500">
                        Selecione ou crie um agente para ver as metricas do cerebro neural.
                      </p>
                    </div>
                  )}
                </section>

                <section id="agent-test" className={activeTab === 'test' ? 'block' : 'hidden'}>
                  <SectionHeading
                    eyebrow="Simulacao"
                    title="Simule atendimento, venda e transbordo"
                    description="Teste respostas reais do agente salvo ou simule o comportamento enquanto ele ainda esta em rascunho."
                  />

                  <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <div className="border-b border-slate-200 bg-white p-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <Avatar label={(draft.name || 'A').charAt(0)} gradient="from-slate-700 to-slate-950" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-slate-950 mb-0 truncate">{draft.name || 'Agente em teste'}</h3>
                          <p className="text-xs font-bold text-slate-500 mb-0 truncate">{draft.role || 'SDR e Atendimento Completo'}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-black text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {testMode === 'cidadao-simulator'
                              ? 'Voce fala como assessor'
                              : selectedAgent
                                ? 'Resposta real do agente'
                                : 'Simulacao de rascunho'}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => setTestMode('cidadao-simulator')}
                              className={`h-8 rounded-md px-3 text-[11px] font-black transition ${
                                testMode === 'cidadao-simulator' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                              }`}
                            >
                              Eu sou assessor
                            </button>
                            <button
                              type="button"
                              onClick={() => setTestMode('agent-reply')}
                              className={`h-8 rounded-md px-3 text-[11px] font-black transition ${
                                testMode === 'agent-reply' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                              }`}
                            >
                              Eu sou cidadão
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={resetChat}
                            className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
                            title="Limpar conversa"
                          >
                            <Repeat2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="agent-whatsapp-bg p-4">
                        <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-400 shadow-sm">
                          Hoje
                        </div>
                        <div className="mt-3 max-h-[520px] min-h-[420px] space-y-3 overflow-y-auto pr-1">
                          {chatMessages.length === 0 && (
                            <div className="flex h-[320px] items-center justify-center text-center">
                              <div className="max-w-sm rounded-lg border border-white/70 bg-white/80 px-5 py-4 shadow-sm">
                                <MessageCircle className="mx-auto text-emerald-600" size={22} />
                                <p className="mt-2 text-sm font-black text-slate-800 mb-0">
                                  Escreva a primeira mensagem livre.
                                </p>
                                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 mb-0">
                                  {testMode === 'cidadao-simulator'
                                    ? 'Voce manda como assessor e o cidadão responde com comportamento realista.'
                                    : 'Voce manda como cidadão e valida a resposta do agente.'}
                                </p>
                              </div>
                            </div>
                          )}
                          {chatMessages.map((message) => (
                            <ChatBubble key={message.id} side={message.side}>
                              {message.content}
                            </ChatBubble>
                          ))}
                          {chatLoading && (
                            <div className="w-fit rounded-lg bg-white px-3 py-2 text-slate-400 shadow-sm">
                              <span className="inline-flex gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                              </span>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                      </div>

                      <form
                        className="border-t border-slate-200 bg-white p-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          runTest(chatInput);
                        }}
                      >
                        {testMode === 'cidadao-simulator' ? (
                          <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
                            Modo livre: voce escreve como assessor e a IA responde como cidadão simulado.
                          </div>
                        ) : !selectedAgent && (
                          <div className="mb-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                            Salve ou publique o agente para testar a resposta real da IA.
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="min-h-11 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            placeholder={testMode === 'cidadao-simulator' ? 'Digite sua mensagem para o cidadão...' : 'Digite como se fosse o cidadão...'}
                            rows={2}
                          />
                          <button
                            type="submit"
                            disabled={chatLoading || !chatInput.trim()}
                            className="h-11 w-11 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50"
                            title="Enviar mensagem"
                          >
                            {chatLoading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-black text-slate-950 mb-0">Diagnostico do teste</h3>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Diagnostic label="Intencao" value={previewDiagnostics.intent} tone="green" />
                          <Diagnostic label="Orcamento" value={previewDiagnostics.budget} tone="slate" />
                          <Diagnostic label="Cidade" value={previewDiagnostics.city} tone="slate" />
                          <Diagnostic label="Temperatura" value={previewDiagnostics.temperature} tone="orange" />
                        </div>
                        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Proxima acao</div>
                          <div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-950">
                            <LayoutGrid size={16} />
                            {previewDiagnostics.nextAction}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-950 text-slate-100 flex items-center justify-center">
                            <Bot size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-950 mb-0">Resumo operacional</h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 mb-0">
                              {draft.channels?.length || 1} canal(is), {draft.tools?.length || 0} ferramenta(s) e autonomia nivel {draft.autonomy_level || 2}.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <footer className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  onClick={resetDraft}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={goToPreviousStep}
                    disabled={isFirstStep}
                    className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ChevronLeft size={17} />
                    Voltar
                  </button>
                  {!isLastStep && (
                    <button
                      onClick={goToNextStep}
                      className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-black text-white flex items-center justify-center gap-2 hover:bg-slate-800"
                    >
                      Próxima etapa
                      <ArrowRight size={17} />
                    </button>
                  )}
                  <button
                    onClick={() => saveAgent('Rascunho')}
                    disabled={saving}
                    className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                    Salvar rascunho
                  </button>
                  <button
                    onClick={() => saveAgent('Ativo')}
                    disabled={saving}
                    className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="animate-spin" size={17} /> : <Rocket size={17} />}
                    Publicar agente
                  </button>
                </div>
              </div>
            </footer>
          </section>
        </div>

      <style>{`
        .agent-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          background: #f8fafd;
          border-radius: 8px;
          padding: 11px 13px;
          min-height: 44px;
          font-size: 14px;
          font-weight: 650;
          color: #0f172a;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .agent-input::placeholder {
          color: #94a3b8;
          font-weight: 600;
        }

        .agent-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
          background: #ffffff;
        }

        .agent-whatsapp-bg {
          background:
            radial-gradient(circle at 20% 10%, rgba(16, 185, 129, .08), transparent 24%),
            radial-gradient(circle at 84% 20%, rgba(139, 92, 246, .08), transparent 26%),
            #f6f3ee;
        }
      `}</style>
    </div>
  );
};

const SidebarItem: React.FC<{
  icon: React.ElementType;
  label: string;
  count?: number;
  active?: boolean;
}> = ({ icon: Icon, label, count, active }) => (
  <button
    className={`h-10 min-w-max rounded-lg border px-3 flex items-center justify-between gap-3 text-left transition ${
      active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'
    }`}
  >
    <span className="min-w-0 flex items-center gap-3">
      <Icon size={16} className={active ? 'text-emerald-600' : 'text-slate-400'} />
      <span className="truncate text-xs font-black">{label}</span>
    </span>
    {typeof count === 'number' && (
      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{count}</span>
    )}
  </button>
);

const Avatar: React.FC<{ label: string; gradient: string }> = ({ label, gradient }) => (
  <div className={`h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br ${gradient} p-[2px] shadow-sm`}>
    <div className="h-full w-full rounded-[6px] bg-white/10 flex items-center justify-center text-sm font-black text-white">
      {label}
    </div>
  </div>
);

const SectionHeading: React.FC<{ eyebrow: string; title: string; description: string }> = ({
  eyebrow,
  title,
  description,
}) => (
  <div>
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{eyebrow}</div>
    <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 mb-0">{title}</h2>
    <p className="mt-1 text-sm font-medium text-slate-500 mb-0">{description}</p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
    {children}
  </label>
);

const StatusPill: React.FC<{ status: string; compact?: boolean }> = ({ status, compact }) => {
  const active = status === 'Ativo' || status === 'Em teste';
  const draft = status === 'Rascunho';
  const className = active
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : draft
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-slate-50 text-slate-500';

  return (
    <span className={`h-9 rounded-lg border px-3 text-xs font-black inline-flex items-center gap-2 ${className}`}>
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : draft ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {compact ? status : `Agente ${status.toLowerCase()}`}
    </span>
  );
};

const ChatBubble: React.FC<{ side: 'cidadao' | 'agent'; children: React.ReactNode }> = ({ side, children }) => (
  <div className={`flex ${side === 'agent' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[96%] rounded-lg px-3 py-2 text-xs font-semibold leading-relaxed shadow-sm ${
        side === 'agent' ? 'bg-[#D9FDD3] text-slate-800' : 'bg-white text-slate-800'
      }`}
    >
      <p className="mb-0">{children}</p>
      <div className="mt-1 text-right text-[9px] font-bold text-slate-400">{side === 'agent' ? '10:31' : '10:30'}</div>
    </div>
  </div>
);

const Diagnostic: React.FC<{ label: string; value: string; tone: 'green' | 'orange' | 'slate' }> = ({
  label,
  value,
  tone,
}) => {
  const colors = {
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[tone]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{label}</div>
      <div className="mt-1 text-xs font-black">{value}</div>
    </div>
  );
};

const PreviewMetric: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
}> = ({ icon: Icon, label, value, change }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3">
    <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center">
      <Icon size={16} />
    </div>
    <div className="mt-3 text-base font-black text-slate-950">{value}</div>
    <div className="text-[10px] font-black text-emerald-600">{change}</div>
    <div className="mt-1 text-[10px] font-bold leading-snug text-slate-500">{label}</div>
  </div>
);

export default AIAgents;
