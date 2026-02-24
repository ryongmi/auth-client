export const queryKeys = {
  auth: {
    all: () => ['auth'] as const,
    initialize: () => ['auth', 'initialize'] as const,
  },
  oauth: {
    all: () => ['oauth'] as const,
    linkedAccounts: () => ['oauth', 'linkedAccounts'] as const,
  },
  accountMerge: {
    all: () => ['accountMerge'] as const,
    verifyToken: (token: string | null) => ['accountMerge', 'verifyToken', token] as const,
  },
} as const;
