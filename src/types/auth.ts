export interface User {
  id: number;
  username: string;
  email: string;
  is_active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface SignupResponse extends User {}

