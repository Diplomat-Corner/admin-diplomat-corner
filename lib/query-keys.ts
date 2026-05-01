/** Hierarchical keys for TanStack Query — use with invalidateQueries / prefetch. */

export type ReportsListFilters = {
  status: string;
  entityType: string;
};

export const queryKeys = {
  reports: {
    all: ["reports"] as const,
    lists: () => [...queryKeys.reports.all, "list"] as const,
    list: (filters: ReportsListFilters) =>
      [...queryKeys.reports.lists(), filters] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    detail: (id: string) => [...queryKeys.reviews.all, "detail", id] as const,
  },
  cars: {
    all: ["cars"] as const,
    adminList: () => [...queryKeys.cars.all, "admin"] as const,
    detail: (id: string) => [...queryKeys.cars.all, "detail", id] as const,
  },
  houses: {
    all: ["houses"] as const,
    adminList: () => [...queryKeys.houses.all, "admin"] as const,
    stats: () => [...queryKeys.houses.all, "stats"] as const,
    detail: (id: string) => [...queryKeys.houses.all, "detail", id] as const,
  },
  advertisements: {
    all: ["advertisements"] as const,
    detail: (id: string) =>
      [...queryKeys.advertisements.all, "detail", id] as const,
  },
} as const;
