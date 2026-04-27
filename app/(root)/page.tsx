"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Home, ImageIcon, Package, TrendingUp, Users } from "lucide-react";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { RecentListings } from "@/components/admin/recent-listings";
import { RecentAds } from "@/components/admin/recent-ads";
import RequestsTable from "@/components/admin/requests-table";
import { useEffect, useState } from "react";
import { IHouse } from "@/lib/models/house.model";
import { ICar } from "@/lib/models/car.model";
import { ProductOverview } from "@/components/admin/product-overview";
import { Skeleton } from "@/components/ui/skeleton";

// Loading components
function StatsCardLoading() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px] mb-1" />
        <Skeleton className="h-3 w-[100px]" />
      </CardContent>
    </Card>
  );
}

function RecentListingsLoading() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <Skeleton className="h-6 w-[140px] mb-2" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentAdsLoading() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <Skeleton className="h-6 w-[180px] mb-2" />
        <Skeleton className="h-4 w-[250px]" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-3 w-[120px]" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProductOverviewLoading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <StatsCardLoading key={i} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[140px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const [houses, setHouses] = useState<IHouse[]>([]);
  const [cars, setCars] = useState<ICar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [housesResponse, carsResponse] = await Promise.all([
          fetch("/api/house"),
          fetch("/api/cars"),
        ]);

        if (!housesResponse.ok || !carsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const housesData = await housesResponse.json();
        const carsData = await carsResponse.json();

        setHouses(Array.isArray(housesData.houses) ? housesData.houses : []);
        setCars(Array.isArray(carsData.cars) ? carsData.cars : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateMonthlyChange = (items: (IHouse | ICar)[]) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthCount = items.filter((item) => {
      const createdAt = new Date(item.createdAt || "");
      return createdAt >= lastMonth && createdAt < currentMonth;
    }).length;

    const currentMonthCount = items.filter((item) => {
      const createdAt = new Date(item.createdAt || "");
      return createdAt >= currentMonth;
    }).length;

    if (lastMonthCount === 0) return 100;
    return ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
  };

  const pendingApprovals = [
    ...houses.filter((house) => house.status === "Pending"),
    ...cars.filter((car) => car.status === "Pending"),
  ].length;

  const totalProducts = houses.length + cars.length;
  const housesCount = houses.length;
  const carsCount = cars.length;

  const housesChange = calculateMonthlyChange(houses);
  const carsChange = calculateMonthlyChange(cars);
  const totalChange = calculateMonthlyChange([...houses, ...cars]);

  return (
    <div className="main-content space-y-4 p-4 md:p-8">
      <DashboardHeader />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="advertisements">Advertisements</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <StatsCardLoading key={i} />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RecentListingsLoading />
                <RecentAdsLoading />
              </div>
            </>
          ) : (
            <>
              <DashboardStats />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Listings</CardTitle>
                    <CardDescription>
                      Recently added or updated product listings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentListings houses={houses} cars={cars} />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Advertisements</CardTitle>
                    <CardDescription>
                      Recently created or scheduled advertisements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentAds />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <ProductOverview houses={houses} cars={cars} loading={loading} />
        </TabsContent>
        <TabsContent value="advertisements" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <StatsCardLoading key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Ads
                  </CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Scheduled Ads
                  </CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +4 from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ad Impressions
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24.8K</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +0.5% from last week
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        <TabsContent value="requests" className="space-y-4">
          <RequestsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
