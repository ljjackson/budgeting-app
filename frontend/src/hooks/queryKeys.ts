export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters: Record<string, string>) =>
      ['transactions', 'list', filters] as const,
  },
  reports: {
    all: ['reports'] as const,
    byCategory: (params: Record<string, string>) =>
      ['reports', 'by-category', params] as const,
    byAccount: (params: Record<string, string>) =>
      ['reports', 'by-account', params] as const,
  },
};
