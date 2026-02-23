"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomScenario,
  deleteCustomScenario,
  listScenarios,
  updateCustomScenario,
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

export const useUpdateScenarioMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { scenarioId: string; payload: CreateCustomScenarioInput }) =>
      updateCustomScenario(input.scenarioId, input.payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
};

export const useDeleteScenarioMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scenarioId: string) => deleteCustomScenario(scenarioId, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};
