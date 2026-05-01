"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetchJson } from "@/lib/api/admin-json";
import { queryKeys } from "@/lib/query-keys";

export function useReviewQuery<T = unknown>(reviewId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(reviewId),
    enabled: reviewId.length > 0,
    queryFn: async () =>
      adminFetchJson<T>(`/api/reviews/${reviewId}`),
  });
}
