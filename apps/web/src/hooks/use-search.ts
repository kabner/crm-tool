import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal";
  title: string;
  subtitle: string;
  url: string;
  score?: number;
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  query: string;
}

interface UseGlobalSearchOptions {
  limit?: number;
  types?: string[];
}

export function useGlobalSearch(
  query: string,
  options?: UseGlobalSearchOptions,
) {
  const params = new URLSearchParams();
  params.set("q", query);

  if (options?.limit) {
    params.set("limit", String(options.limit));
  }

  if (options?.types && options.types.length > 0) {
    params.set("types", options.types.join(","));
  }

  return useQuery<SearchResults>({
    queryKey: ["global-search", query, options],
    queryFn: () =>
      apiClient.get<SearchResults>(`/api/v1/search?${params.toString()}`),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
