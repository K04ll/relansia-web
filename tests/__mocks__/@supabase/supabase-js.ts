// Mock minimal Supabase client utilisé dans les tests unitaires
export const createClient = (_url: string, _key: string) => {
  const api: any = {
    from: (_table: string) => api,
    select: (_q?: any, _opts?: any) => Promise.resolve({ data: [], error: null, count: 0 }),
    update: (_v: any) => api,
    insert: (_v: any) => ({ select: (_: any) => ({ single: async () => ({ data: {}, error: null }) }) }),
    eq: (_c: any, _v: any) => api,
    in: (_c: any, _arr: any[]) => api,
    ilike: (_c: any, _v: string) => api,
    order: (_c: string, _o?: any) => api,
    range: (_s: number, _e: number) => Promise.resolve({ data: [], error: null, count: 0 }),
    rpc: (_fn: string, _params?: any) => Promise.resolve({ data: [], error: null }),
  };
  return api;
};
