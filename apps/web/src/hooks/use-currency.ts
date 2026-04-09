import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ExchangeRate {
  id: string;
  tenantId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

export interface ConvertResponse {
  amount: number;
  from: string;
  to: string;
  converted: number;
}

export function useExchangeRates() {
  return useQuery<ExchangeRate[]>({
    queryKey: ["exchange-rates"],
    queryFn: () => apiClient.get<ExchangeRate[]>("/api/v1/currency/rates"),
  });
}

export function useUpsertRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fromCurrency: string; toCurrency: string; rate: number }) =>
      apiClient.put<ExchangeRate>("/api/v1/currency/rates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
  });
}

export function useConvert(amount: number, from: string, to: string) {
  return useQuery<ConvertResponse>({
    queryKey: ["currency-convert", amount, from, to],
    queryFn: () =>
      apiClient.get<ConvertResponse>(
        `/api/v1/currency/convert?amount=${amount}&from=${from}&to=${to}`,
      ),
    enabled: !!from && !!to && amount > 0 && from !== to,
  });
}
