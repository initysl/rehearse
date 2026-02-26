"use client";

import { useCallback, useState } from "react";

export const useAccessToken = () => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
  }, []);

  return {
    accessToken,
    setAccessToken,
  };
};
