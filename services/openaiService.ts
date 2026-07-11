export const openaiService = {
  async generateContent(prompt: string, apiKey?: string): Promise<string> {
    void apiKey;
    throw new Error('OpenAI service nao configurado para este ambiente.');
  },
  async generateText(prompt: string, apiKey?: string): Promise<string> {
    return this.generateContent(prompt, apiKey);
  },
};

export async function generateWithOpenAI(prompt: string): Promise<string> {
  return openaiService.generateContent(prompt);
}
