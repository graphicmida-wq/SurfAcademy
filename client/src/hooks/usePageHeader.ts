import { useQuery } from "@tanstack/react-query";
import type { PageHeader } from "@shared/schema";

export function usePageHeader(page: string) {
  return useQuery<PageHeader | null>({
    queryKey: [`/api/page-headers/${page}`],
    retry: false,
    meta: {
      // Don't throw error if header doesn't exist yet
      errorHandling: 'ignore-404'
    }
  });
}
