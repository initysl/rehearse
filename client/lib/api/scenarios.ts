import { apiRequest } from "./client";
import {
  CreateCustomScenarioInput,
  CreateScenarioResponse,
  DeleteScenarioResponse,
  ListScenariosResponse,
  ScenarioCategory,
  UpdateScenarioResponse,
} from "./types";

export interface ListScenariosQuery {
  category?: ScenarioCategory;
  search?: string;
  customOnly?: boolean;
  limit?: number;
  offset?: number;
}

export const listScenarios = (
  query: ListScenariosQuery = {},
  accessToken?: string | null
) => {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    ...query,
  };

  return apiRequest<ListScenariosResponse>("/scenarios", {
    query: queryParams,
    accessToken,
  });
};

export const createCustomScenario = (
  payload: CreateCustomScenarioInput,
  accessToken?: string | null
) => {
  return apiRequest<CreateScenarioResponse>("/scenarios/custom", {
    method: "POST",
    body: payload,
    accessToken,
  });
};

export const updateCustomScenario = (
  scenarioId: string,
  payload: CreateCustomScenarioInput,
  accessToken?: string | null
) => {
  return apiRequest<UpdateScenarioResponse>(`/scenarios/custom/${scenarioId}`, {
    method: "PATCH",
    body: payload,
    accessToken,
  });
};

export const deleteCustomScenario = (
  scenarioId: string,
  accessToken?: string | null
) => {
  return apiRequest<DeleteScenarioResponse>(`/scenarios/custom/${scenarioId}`, {
    method: "DELETE",
    accessToken,
  });
};
