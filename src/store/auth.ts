import { create } from "zustand";
import * as storage from "@/lib/storage";

const TOKEN_KEY = "auth_token";

type AuthState = {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (token: string) => {
    await storage.setItem(TOKEN_KEY, token);
    set({ token, isAuthenticated: true });
  },

  logout: async () => {
    await storage.removeItem(TOKEN_KEY);
    set({ token: null, isAuthenticated: false });
  },

  loadToken: async () => {
    const token = await storage.getItem(TOKEN_KEY);
    set({ token, isAuthenticated: !!token, isLoading: false });
  },
}));
