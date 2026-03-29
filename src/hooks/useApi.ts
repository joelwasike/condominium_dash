import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiRequest, buildApiUrl } from '../config/api';

interface MutationVariables {
  method?: string;
  body?: Record<string, any> | FormData;
  urlSuffix?: string;
}

interface UseApiMutationOptions extends Omit<UseMutationOptions<any, Error, MutationVariables>, 'mutationFn'> {
  invalidateKeys?: (string | string[])[];
}

// Generic query hook for GET requests
export function useApiQuery(
  key: string | string[],
  endpoint: string,
  options: Partial<UseQueryOptions<any, Error>> & { enabled?: boolean } = {}
) {
  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const url = buildApiUrl(endpoint);
      return apiRequest(url);
    },
    enabled: !isDemoMode && (options.enabled !== false),
    ...options,
  });
}

// Generic mutation hook for POST/PUT/DELETE
export function useApiMutation(endpoint: string, options: UseApiMutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ method = 'POST', body, urlSuffix = '' }: MutationVariables) => {
      const url = buildApiUrl(endpoint + urlSuffix);
      const fetchOptions: RequestInit = { method };
      if (body) {
        if (body instanceof FormData) {
          fetchOptions.body = body;
        } else {
          fetchOptions.body = JSON.stringify(body);
        }
      }
      return apiRequest(url, fetchOptions);
    },
    onSuccess: () => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
    },
    ...options,
  });
}
