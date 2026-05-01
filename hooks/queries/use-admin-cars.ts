"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetchJson } from "@/lib/api/admin-json";
import { queryKeys } from "@/lib/query-keys";
import {
  normalizeMongoId,
  unwrapApiListingPayload,
} from "@/lib/utils";

const ADMIN_CARS_URL = "/api/cars?all=1&includeAllStatuses=1";

export function useAdminCarsQuery() {
  return useQuery({
    queryKey: queryKeys.cars.adminList(),
    queryFn: async () => {
      const result = await adminFetchJson<{
        cars?: unknown[];
        success?: boolean;
      }>(ADMIN_CARS_URL);
      return (result.cars ?? []) as unknown[];
    },
  });
}

export function useCarDetailQuery(carId: string | undefined) {
  return useQuery({
    queryKey: carId ? queryKeys.cars.detail(carId) : queryKeys.cars.all,
    enabled: Boolean(carId),
    queryFn: async () => {
      const result = await adminFetchJson<Record<string, unknown>>(
        `/api/cars/${carId}`
      );
      const payload = unwrapApiListingPayload(result, "car");
      const id = normalizeMongoId(payload?._id);
      if (!payload || !id) {
        throw new Error(
          typeof result.error === "string" ? result.error : "Car not found"
        );
      }
      return { ...payload, _id: id } as Record<string, unknown>;
    },
  });
}

export function usePatchCarStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      carId,
      status,
    }: {
      carId: string;
      status: string;
    }) => {
      await adminFetchJson(`/api/cars/${carId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return carId;
    },
    onSuccess: (_, { carId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.cars.adminList() });
      qc.invalidateQueries({ queryKey: queryKeys.cars.detail(carId) });
    },
  });
}

export function useDeleteCarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      await adminFetchJson(`/api/cars/${carId}?isAdmin=true`, {
        method: "DELETE",
      });
      return carId;
    },
    onSuccess: (_, carId) => {
      qc.invalidateQueries({ queryKey: queryKeys.cars.adminList() });
      qc.removeQueries({ queryKey: queryKeys.cars.detail(carId) });
    },
  });
}
