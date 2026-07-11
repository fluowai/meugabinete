export interface AgentFlowStep {
  id?: string;
  title?: string;
  description?: string;
  action?: string;
  [key: string]: any;
}

export interface AIAgentPayload {
  name?: string;
  role?: string;
  description?: string;
  instructions?: string;
  personality?: string;
  response_style?: string;
  tools?: string[];
  capabilities?: string[];
  [key: string]: any;
}

export interface AIAgent extends AIAgentPayload {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgentMetrics {
  total_conversations?: number;
  resolved_conversations?: number;
  handoff_count?: number;
  average_confidence?: number;
  [key: string]: any;
}

export const aiAgentService = {
  async list(): Promise<AIAgent[]> {
    return [];
  },

  async create(payload: AIAgentPayload): Promise<AIAgent> {
    return { id: crypto.randomUUID(), ...payload };
  },

  async update(id: string, payload: AIAgentPayload): Promise<AIAgent> {
    return { id, ...payload };
  },

  async remove(id: string): Promise<void> {
    void id;
  },

  async metrics(agentId: string): Promise<AgentMetrics> {
    void agentId;
    return {};
  },

  async qualify(agentId: string, payload: any): Promise<any> {
    return { agentId, ...payload };
  },

  async chat(agentId: string, message: string, sessionId?: string): Promise<{ message: string; sessionId?: string }> {
    return {
      message: `Agente ${agentId} ainda nao configurado. Mensagem recebida: ${message}`,
      sessionId,
    };
  },
};
