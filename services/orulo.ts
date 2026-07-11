export const oruloService = {
  async getMasterCredentials() {
    return { configured: false, source: 'disabled', updatedAt: null };
  },

  async saveMasterCredentials(clientId: string, clientSecret: string) {
    return {
      configured: Boolean(clientId && clientSecret),
      clientId,
      source: 'disabled',
      updatedAt: new Date().toISOString(),
    };
  },
};
