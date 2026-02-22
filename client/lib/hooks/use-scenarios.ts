"use client";

import { useQuery } from "@tanstack/react-query";
import { listScenarios, type ListScenariosQuery } from "../api/scenarios";
import { queryKeys } from "../query/keys";

export const useScenariosQuery = (
  accessToken: string | null,
  query: ListScenariosQuery = {},
  enabled = true
) => {
  return useQuery({
    queryKey: [...queryKeys.scenarios.list(query), accessToken ? "authed" : "anon"],
    queryFn: () => listScenarios(query, accessToken),
    enabled,
  });
};
