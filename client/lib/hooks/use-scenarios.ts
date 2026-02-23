"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomScenario,
  listScenarios,
  type ListScenariosQuery,
} from "../api/scenarios";
import type { CreateCustomScenarioInput } from "../api/types";
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

export const useCreateScenarioMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomScenarioInput) =>
      createCustomScenario(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
};
