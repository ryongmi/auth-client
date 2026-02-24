import { useQuery } from '@tanstack/react-query';
import { oauthService } from '@/services/oauthService';
import type { AuthError } from '@/types';
import type { OAuthAccountSearchResult } from '@krgeobuk/oauth/interfaces';
import { queryKeys } from './keys';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useLinkedAccounts(accessToken: string | null) {
  return useQuery<OAuthAccountSearchResult[], AuthError>({
    queryKey: queryKeys.oauth.linkedAccounts(),
    queryFn: () => oauthService.getLinkedAccounts(accessToken!),
    enabled: !!accessToken,
  });
}
