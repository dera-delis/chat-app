import { apiClient } from './axios';
import { AuthResponse, SignupResponse, User } from '../types/auth';

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  signup: async (data: SignupData): Promise<SignupResponse> => {
    const response = await apiClient.post<SignupResponse>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

