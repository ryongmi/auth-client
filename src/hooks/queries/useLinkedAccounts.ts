import { useQuery } from '@tanstack/react-query';
import { oauthService } from '@/services/oauthService';
import type { AuthError } from '@/types';
import type { OAuthAccountSearchResult } from '@krgeobuk/oauth/interfaces';

export function useLinkedAccounts(accessToken: string | null) {
  return useQuery<OAuthAccountSearchResult[], AuthError>({
    queryKey: ['linkedAccounts'],
    queryFn: () => oauthService.getLinkedAccounts(accessToken!),
    enabled: !!accessToken,
  });
}
