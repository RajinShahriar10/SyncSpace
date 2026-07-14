import api from "./api";

export interface AuthResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiry: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  };
  success: boolean;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface GithubLoginRequest {
  accessToken: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", data);
  return response.data;
}

export async function githubLogin(data: GithubLoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/github", data);
  return response.data;
}

export async function refreshTokens(
  accessToken: string,
  refreshToken: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/refresh", {
    accessToken,
    refreshToken,
  });
  return response.data;
}

export async function revokeToken(refreshToken: string): Promise<void> {
  await api.post("/auth/revoke", { refreshToken });
}

export async function getCurrentUser(): Promise<AuthResponse["data"]["user"]> {
  const response = await api.get<{ data: AuthResponse["data"]["user"] }>("/auth/me");
  return response.data.data;
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}
