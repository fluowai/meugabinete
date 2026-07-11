import { logger } from '@/utils/logger';
import { groqService } from './groqService';

export interface AIConfig {
  provider?: 'openai' | 'gemini' | 'groq';
  openaiKey?: string;
  geminiKey?: string;
  groqKey?: string;
}

export interface DemandAnalysis {
  category: string;
  priority: 'urgente' | 'alta' | 'normal' | 'baixa';
  summary: string;
  missingData: string[];
  nextAction: string;
  department: string;
}

export interface ContentGeneration {
  title: string;
  body: string;
  hashtags: string[];
  channel: string;
  tone: string;
}

export const analyzeDemand = async (
  message: string,
  config?: AIConfig
): Promise<DemandAnalysis> => {
  const prompt = `
Analise esta mensagem de um cidadão para um gabinete público e retorne um JSON com:

{
  "category": "saude|educacao|seguranca|infraestrutura|assistencia_social|meio_ambiente|trabalho|habitacao|transporte|cultura|agricultura|justica|outro",
  "priority": "urgente|alta|normal|baixa",
  "summary": "Resumo da demanda em até 200 caracteres",
  "missingData": ["lista de dados faltantes para resolver"],
  "nextAction": "Próxima ação recomendada",
  "department": "Secretaria ou setor competente"
}

Mensagem do cidadão:
${message}

Retorne APENAS o JSON. Sem markdown. Sem explicações.
`;

  try {
    let text = '{}';

    if (config?.groqKey) {
      text = await groqService.generateText(prompt, config.groqKey);
    } else {
      text = await groqService.generateText(prompt, config?.groqKey || '');
    }

    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      category: parsed.category || 'outro',
      priority: parsed.priority || 'normal',
      summary: parsed.summary || message.slice(0, 200),
      missingData: Array.isArray(parsed.missingData) ? parsed.missingData : [],
      nextAction: parsed.nextAction || 'Classificar demanda',
      department: parsed.department || 'Gabinete',
    };
  } catch (error) {
    logger.error('Error analyzing demand:', error);
    return {
      category: 'outro',
      priority: 'normal',
      summary: message.slice(0, 200),
      missingData: [],
      nextAction: 'Revisar manualmente',
      department: 'Gabinete',
    };
  }
};

export const generatePoliticalContent = async (
  topic: string,
  channel: 'instagram' | 'facebook' | 'twitter' | 'newsletter' | 'comunicado',
  config?: AIConfig
): Promise<ContentGeneration> => {
  const channelDescriptions: Record<string, string> = {
    instagram: 'Post para Instagram com linguagem visual e engajadora',
    facebook: 'Post para Facebook com tom informativo e acessível',
    twitter: 'Tweet conciso e direto com máximo 280 caracteres',
    newsletter: 'E-mail informativo para assinantes com contexto e dados',
    comunicado: 'Comunicado oficial do gabinete com linguagem formal e institucional',
  };

  const prompt = `
Gere conteúdo político para o canal "${channel}" sobre o tema: ${topic}

Canal: ${channelDescriptions[channel] || channel}

Retorne um JSON:
{
  "title": "Título chamativo",
  "body": "Corpo do texto formatado para ${channel}",
  "hashtags": ["hashtag1", "hashtag2"],
  "channel": "${channel}",
  "tone": "Tom utilizado"
}

Retorne APENAS o JSON. Sem markdown. Sem explicações.
`;

  try {
    let text = '{}';

    if (config?.groqKey) {
      text = await groqService.generateText(prompt, config.groqKey);
    } else {
      text = await groqService.generateText(prompt, config?.groqKey || '');
    }

    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      title: parsed.title || topic,
      body: parsed.body || '',
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      channel,
      tone: parsed.tone || 'institucional',
    };
  } catch (error) {
    logger.error('Error generating content:', error);
    return {
      title: topic,
      body: '',
      hashtags: [],
      channel,
      tone: 'institucional',
    };
  }
};

export const generateLegislativeText = async (
  type: 'lei' | 'mocao' | 'requerimento' | 'oficio',
  subject: string,
  details: string,
  config?: AIConfig
): Promise<string> => {
  const typeDescriptions: Record<string, string> = {
    lei: 'Projeto de Lei',
    mocao: 'Moção',
    requerimento: 'Requerimento',
    oficio: 'Ofício',
  };

  const prompt = `
Elabore um ${typeDescriptions[type]} sobre: ${subject}

Detalhes: ${details}

Use linguagem jurídica adequada, seguindo o padrão legislativo brasileiro.
Inclua: ementa, justificativa, artigos (se aplicável) e dispositivo final.

Retorne o texto formatado em Markdown.
`;

  try {
    if (config?.groqKey) {
      return await groqService.generateText(prompt, config.groqKey);
    }
    return await groqService.generateText(prompt, config?.groqKey || '');
  } catch (error) {
    logger.error('Error generating legislative text:', error);
    throw new Error('Falha ao gerar texto legislativo: ' + (error as any).message);
  }
};
