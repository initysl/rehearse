"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";
import {
  getGoogleOAuthStartUrl,
  getMe,
  logoutSession,
  refreshSession,
} from "../api/auth";
import { queryKeys } from "../query/keys";

export const useMeQuery = (accessToken: string | null) => {
  void accessToken;
  return useQuery({
    queryKey: queryKeys.auth.me("authed"),
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          try {
            await refreshSession();
            return await getMe();
          } catch (refreshError) {
            if (
              refreshError instanceof ApiError &&
              (refreshError.status === 401 || refreshError.status === 403)
            ) {
              return null;
            }
            throw refreshError;
          }
        }

        throw error;
      }
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
      void result;
      setAccessToken(null);
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
