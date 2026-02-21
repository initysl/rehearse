"use client";

import { useQuery } from "@tanstack/react-query";
import { listScenarios, type ListScenariosQuery } from "../api/scenarios";
import { queryKeys } from "../query/keys";

export const useScenariosQuery = (
  accessToken: string | null,
  query: ListScenariosQuery = {}
) => {
  return useQuery({
    queryKey: queryKeys.scenarios.list(query),
    queryFn: () => listScenarios(query, accessToken),
    enabled: Boolean(accessToken),
  });
};
