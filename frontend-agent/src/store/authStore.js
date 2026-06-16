import { create } from 'zustand';
import { agentAuthApi } from '../services/agent.api';

export const useAuthStore = create((set) => ({
  agent: null,
  loading: true,
  async fetchMe() {
    try {
      const { data } = await agentAuthApi.me();
      set({ agent: data.data, loading: false });
    } catch {
      set({ agent: null, loading: false });
    }
  },
  async login(credentials) {
    const { data } = await agentAuthApi.login(credentials);
    set({ agent: data.data });
    return data;
  },
  async logout() {
    try {
      await agentAuthApi.logout();
    } finally {
      set({ agent: null });
    }
  },
  setAgent(agent) {
    set({ agent });
  },
}));
