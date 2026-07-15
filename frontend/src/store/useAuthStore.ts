import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { access: string; refresh: string }, user: User) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: User) => void;
}

const getStoredAuth = () => {
  try {
    const accessToken = localStorage.getItem('taskflow_access_token');
    const refreshToken = localStorage.getItem('taskflow_refresh_token');
    const userStr = localStorage.getItem('taskflow_user');
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      accessToken,
      refreshToken,
      user,
      isAuthenticated: !!accessToken,
    };
  } catch (e) {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    };
  }
};

const initialAuth = getStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  accessToken: initialAuth.accessToken,
  refreshToken: initialAuth.refreshToken,
  isAuthenticated: initialAuth.isAuthenticated,
  isLoading: false,

  login: (tokens, user) => {
    localStorage.setItem('taskflow_access_token', tokens.access);
    localStorage.setItem('taskflow_refresh_token', tokens.refresh);
    localStorage.setItem('taskflow_user', JSON.stringify(user));

    set({
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem('taskflow_access_token');
    localStorage.removeItem('taskflow_refresh_token');
    localStorage.removeItem('taskflow_user');

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setAccessToken: (token) => {
    localStorage.setItem('taskflow_access_token', token);
    set({ accessToken: token, isAuthenticated: true });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  updateUser: (user) => {
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    set({ user });
  },
}));
