"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { HousesTable } from "@/components/admin/houses-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

interface HouseStats {
  totalHouses: number;
  forSaleHouses: number;
  forRentHouses: number;
  pendingHouses: number;
  statusCounts?: Record<string, number>;
}

const statusTabValue = (status: string) => `status-${status}`;

const formatStatusLabel = (status: string) => {
  if (status.toLowerCase() === "pending") {
    return "Pending Approval";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export function HouseDashboard() {
  const [stats, setStats] = useState<HouseStats>({
    totalHouses: 0,
    forSaleHouses: 0,
    forRentHouses: 0,
    pendingHouses: 0,
    statusCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/house/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch house statistics");
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching house statistics:", error);
        showToast("Failed to load house statistics", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [showToast]);

  const handleStatusChange = async (
    houseId: string,
    newStatus: "Pending" | "Active"
  ) => {
    try {
      const response = await fetch(`/api/house/${houseId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update house status");
      }

      showToast(`House status updated to ${newStatus}`, "success");

      // Refresh stats after status change
      const statsResponse = await fetch("/api/house/stats");
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error updating house status:", error);
      showToast("Failed to update house status", "error");
    }
  };

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
              {loading ? "..." : stats.totalHouses}
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
              {loading ? "..." : stats.forSaleHouses}
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
              {loading ? "..." : stats.forRentHouses}
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
              {loading ? "..." : stats.pendingHouses}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Houses</TabsTrigger>
          <TabsTrigger value="for-sale">For Sale</TabsTrigger>
          <TabsTrigger value="for-rent">For Rent</TabsTrigger>
          {Object.keys(stats.statusCounts ?? {})
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
        {Object.keys(stats.statusCounts ?? {})
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
