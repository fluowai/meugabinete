export const geminiService = {
  async generateContent(prompt: string, apiKey?: string): Promise<string> {
    void apiKey;
    throw new Error('Gemini service nao configurado para este ambiente.');
  },
  async generateText(prompt: string, apiKey?: string): Promise<string> {
    return this.generateContent(prompt, apiKey);
  },
};

export async function generateWithGemini(prompt: string): Promise<string> {
  return geminiService.generateContent(prompt);
}
