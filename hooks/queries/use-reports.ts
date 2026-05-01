"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetchJson } from "@/lib/api/admin-json";
import {
  queryKeys,
  type ReportsListFilters,
} from "@/lib/query-keys";

export function useReportsQuery<TData = unknown[]>(filters: ReportsListFilters) {
  return useQuery({
    queryKey: queryKeys.reports.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.entityType !== "all")
        params.append("entityType", filters.entityType);
      const q = params.toString();
      return adminFetchJson<TData>(
        `/api/reports${q ? `?${q}` : ""}`
      );
    },
  });
}

type PatchReportBody =
  | { status: string }
  | { adminNotes: string }
  | Record<string, unknown>;

export function usePatchReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      body,
    }: {
      reportId: string;
      body: PatchReportBody;
    }) => {
      await adminFetchJson<unknown>(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return reportId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
