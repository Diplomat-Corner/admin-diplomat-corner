"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetchJson } from "@/lib/api/admin-json";
import { queryKeys } from "@/lib/query-keys";
import {
  normalizeMongoId,
  unwrapApiListingPayload,
} from "@/lib/utils";

const ADMIN_HOUSES_URL = "/api/house?all=1&includeAllStatuses=1";

export function useAdminHousesQuery() {
  return useQuery({
    queryKey: queryKeys.houses.adminList(),
    queryFn: async () => {
      const data = await adminFetchJson<{
        houses?: unknown[];
        success?: boolean;
      }>(ADMIN_HOUSES_URL);
      if (Array.isArray(data.houses)) return data.houses as unknown[];
      return [];
    },
  });
}

export type HouseStatsResponse = {
  totalHouses: number;
  forSaleHouses: number;
  forRentHouses: number;
  pendingHouses: number;
  statusCounts?: Record<string, number>;
};

export function useHouseStatsQuery() {
  return useQuery({
    queryKey: queryKeys.houses.stats(),
    queryFn: () => adminFetchJson<HouseStatsResponse>("/api/house/stats"),
  });
}

export function useHouseDetailQuery(houseId: string | undefined) {
  return useQuery({
    queryKey: houseId ? queryKeys.houses.detail(houseId) : queryKeys.houses.all,
    enabled: Boolean(houseId),
    queryFn: async () => {
      const result = await adminFetchJson<Record<string, unknown>>(
        `/api/house/${houseId}`
      );
      const payload = unwrapApiListingPayload(result, "house");
      const id = normalizeMongoId(payload?._id);
      if (!payload || !id) {
        throw new Error(
          typeof result.error === "string" ? result.error : "House not found"
        );
      }
      return { ...payload, _id: id } as Record<string, unknown>;
    },
  });
}

export function usePatchHouseStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      houseId,
      status,
    }: {
      houseId: string;
      status: string;
    }) => {
      await adminFetchJson(`/api/house/${houseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return houseId;
    },
    onSuccess: (_, { houseId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.houses.adminList() });
      qc.invalidateQueries({ queryKey: queryKeys.houses.detail(houseId) });
      qc.invalidateQueries({ queryKey: queryKeys.houses.stats() });
    },
  });
}

export function useDeleteHouseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (houseId: string) => {
      await adminFetchJson(`/api/house/${houseId}`, {
        method: "DELETE",
      });
      return houseId;
    },
    onSuccess: (_, houseId) => {
      qc.invalidateQueries({ queryKey: queryKeys.houses.adminList() });
      qc.invalidateQueries({ queryKey: queryKeys.houses.stats() });
      qc.removeQueries({ queryKey: queryKeys.houses.detail(houseId) });
    },
  });
}
