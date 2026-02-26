import { apiRequest, getApiBaseUrl } from "./client";
import { AuthResponse, MeResponse } from "./types";

export interface RegisterInput {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const registerWithEmail = (payload: RegisterInput) => {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
};

export const loginWithEmail = (payload: LoginInput) => {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
};

export const refreshSession = () => {
  return apiRequest<AuthResponse>("/auth/refresh-token", {
    method: "POST",
  });
};

export const logoutSession = () => {
  return apiRequest<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
};

export const getMe = (accessToken?: string | null) => {
  return apiRequest<MeResponse>("/auth/me", {
    accessToken,
  });
};

export const getGoogleOAuthStartUrl = (next?: string): string => {
  const url = new URL("/auth/oauth/google", getApiBaseUrl());
  if (next) {
    url.searchParams.set("next", next);
  }
  return url.toString();
};
