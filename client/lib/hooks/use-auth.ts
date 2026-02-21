"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGoogleOAuthStartUrl,
  getMe,
  loginWithEmail,
  logoutSession,
  refreshSession,
  registerWithEmail,
  type LoginInput,
  type RegisterInput,
} from "../api/auth";
import { queryKeys } from "../query/keys";

export const useMeQuery = (accessToken: string | null) => {
  return useQuery({
    queryKey: queryKeys.auth.me(accessToken ? "authed" : "anon"),
    queryFn: () => getMe(accessToken),
    enabled: Boolean(accessToken),
  });
};

export const useLoginMutation = (
  setAccessToken: (token: string | null) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginInput) => loginWithEmail(payload),
    onSuccess: (result) => {
      setAccessToken(result.session?.accessToken || null);
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

export const useRegisterMutation = (
  setAccessToken: (token: string | null) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterInput) => registerWithEmail(payload),
    onSuccess: (result) => {
      if (result.session?.accessToken) {
        setAccessToken(result.session.accessToken);
      }
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

export const useRefreshMutation = (
  setAccessToken: (token: string | null) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshSession(),
    onSuccess: (result) => {
      setAccessToken(result.session?.accessToken || null);
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

export const useLogoutMutation = (
  setAccessToken: (token: string | null) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutSession(),
    onSuccess: () => {
      setAccessToken(null);
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.removeQueries({ queryKey: ["scenarios"] });
      queryClient.removeQueries({ queryKey: ["sessions"] });
      queryClient.removeQueries({ queryKey: ["feedback"] });
    },
  });
};

export const beginGoogleOAuth = (nextPath = "/") => {
  window.location.assign(getGoogleOAuthStartUrl(nextPath));
};
