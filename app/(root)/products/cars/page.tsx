"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Plus, Loader2 } from "lucide-react";
import { CarsTable } from "@/components/admin/cars-table";
import Link from "next/link";
import { useState, useEffect } from "react";

// Define the Car type
interface Car {
  _id: string;
  advertisementType: "Sale" | "Rent";
  status?: string;
}

const statusTabValue = (status: string) => `status-${status}`;

const formatStatusLabel = (status: string) => {
  if (status.toLowerCase() === "pending") {
    return "Pending Approval";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function CarsPage() {
  const [stats, setStats] = useState({
    total: 0,
    forSale: 0,
    forRent: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<string[]>([]);

  useEffect(() => {
    const fetchCarStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/cars?all=1&includeAllStatuses=1");

        if (!response.ok) {
          throw new Error("Failed to fetch car data");
        }

        const result = await response.json();

        // Extract the cars array from the API response
        const data: Car[] = result.cars || [];
        console.log("Cars data:", data);

        // Calculate stats
        const total = data.length;
        const forSale = data.filter(
          (car: Car) => car.advertisementType === "Sale"
        ).length;
        const forRent = data.filter(
          (car: Car) => car.advertisementType === "Rent"
        ).length;
        const pending = data.filter(
          (car: Car) => car.status === "Pending"
        ).length;
        const nextStatuses = Array.from(
          new Set<string>(
            data
              .map((car) => car.status?.trim())
              .filter((status: string | undefined): status is string =>
                Boolean(status)
              )
          )
        ).sort((a, b) => a.localeCompare(b));

        setStats({
          total,
          forSale,
          forRent,
          pending,
        });
        setStatuses(nextStatuses);
      } catch (error) {
        console.error("Error fetching car statistics:", error);
        // Set default stats on error
        setStats({
          total: 0,
          forSale: 0,
          forRent: 0,
          pending: 0,
        });
        setStatuses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCarStats();
  }, []);

  return (
    <div className="main-content space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-diplomat-green">
          Cars
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/products/cars/manage">
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Add Car
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">For Sale</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats.forSale}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">For Rent</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats.forRent}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approval
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats.pending}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <TabsList>
          <TabsTrigger value="all">All Cars</TabsTrigger>
          <TabsTrigger value="for-sale">For Sale</TabsTrigger>
          <TabsTrigger value="for-rent">For Rent</TabsTrigger>
          {statuses.map((status) => (
            <TabsTrigger key={status} value={statusTabValue(status)}>
              {formatStatusLabel(status)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CarsTable />
        </TabsContent>
        <TabsContent value="for-sale" className="space-y-4">
          <CarsTable listingType="Sale" />
        </TabsContent>
        <TabsContent value="for-rent" className="space-y-4">
          <CarsTable listingType="Rent" />
        </TabsContent>
        {statuses.map((status) => (
          <TabsContent
            key={status}
            value={statusTabValue(status)}
            className="space-y-4"
          >
            <CarsTable status={status} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
