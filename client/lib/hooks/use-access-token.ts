"use client";

import { useCallback, useState } from "react";
import { getStoredAccessToken, setStoredAccessToken } from "../auth-token";

export const useAccessToken = () => {
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    getStoredAccessToken()
  );

  const setAccessToken = useCallback((token: string | null) => {
    setStoredAccessToken(token);
    setAccessTokenState(token);
  }, []);

  return {
    accessToken,
    setAccessToken,
  };
};
