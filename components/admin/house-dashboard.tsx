"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { HousesTable } from "@/components/admin/houses-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  useHouseStatsQuery,
  usePatchHouseStatusMutation,
} from "@/hooks/queries/use-admin-houses";

const statusTabValue = (status: string) => `status-${status}`;

const formatStatusLabel = (status: string) => {
  if (status.toLowerCase() === "pending") {
    return "Pending Approval";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export function HouseDashboard() {
  const { showToast } = useToast();
  const { data: stats, isPending: loading, isError } = useHouseStatsQuery();
  const patchHouse = usePatchHouseStatusMutation();

  useEffect(() => {
    if (isError) {
      showToast("Failed to load house statistics", "error");
    }
  }, [isError, showToast]);

  const handleStatusChange = (
    houseId: string,
    newStatus: "Pending" | "Active"
  ) => {
    patchHouse.mutate(
      { houseId, status: newStatus },
      {
        onSuccess: () =>
          showToast(`House status updated to ${newStatus}`, "success"),
        onError: () => showToast("Failed to update house status", "error"),
      }
    );
  };

  const statusCounts = stats?.statusCounts ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Houses</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : (stats?.totalHouses ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">For Sale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : (stats?.forSaleHouses ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">For Rent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : (stats?.forRentHouses ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : (stats?.pendingHouses ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Houses</TabsTrigger>
          <TabsTrigger value="for-sale">For Sale</TabsTrigger>
          <TabsTrigger value="for-rent">For Rent</TabsTrigger>
          {Object.keys(statusCounts)
            .sort((a, b) => a.localeCompare(b))
            .map((status) => (
              <TabsTrigger key={status} value={statusTabValue(status)}>
                {formatStatusLabel(status)}
              </TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <HousesTable />
        </TabsContent>
        <TabsContent value="for-sale" className="space-y-4">
          <HousesTable listingType="sale" />
        </TabsContent>
        <TabsContent value="for-rent" className="space-y-4">
          <HousesTable listingType="rent" />
        </TabsContent>
        {Object.keys(statusCounts)
          .sort((a, b) => a.localeCompare(b))
          .map((status) => (
            <TabsContent
              key={status}
              value={statusTabValue(status)}
              className="space-y-4"
            >
              <HousesTable
                status={status}
                onApprove={(id: string) => handleStatusChange(id, "Active")}
                onReject={(id: string) => handleStatusChange(id, "Pending")}
              />
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
