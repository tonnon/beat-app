import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedUser, type AuthenticatedUser } from '@/services/auth/authService';

const USER_DATA_QUERY_KEY = 'authenticated-user';

export function useUserData(token: string | null) {
  return useQuery<AuthenticatedUser, Error>({
    queryKey: [USER_DATA_QUERY_KEY, token],
    queryFn: () => {
      if (!token) {
        return Promise.reject(new Error('Missing authentication token'));
      }

      return getAuthenticatedUser(token);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
