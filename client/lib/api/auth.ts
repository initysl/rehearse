import { apiRequest, getApiBaseUrl } from "./client";
import { AuthResponse, MeResponse } from "./types";

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
