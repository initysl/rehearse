import { apiRequest } from "./client";
import { ListScenariosResponse } from "./types";

export interface ListScenariosQuery {
  category?: "work" | "health" | "family" | "social" | "financial" | "legal";
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
