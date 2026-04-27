"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Home, ImageIcon, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { IHouse } from "@/lib/models/house.model";
import { ICar } from "@/lib/models/car.model";

export function DashboardStats() {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="text-2xl font-bold">{totalProducts}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {totalChange >= 0 ? "+" : ""}
            {totalChange.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Houses</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="text-2xl font-bold">{housesCount}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {housesChange >= 0 ? "+" : ""}
            {housesChange.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cars</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="text-2xl font-bold">{carsCount}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {carsChange >= 0 ? "+" : ""}
            {carsChange.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Approval
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="text-2xl font-bold">{pendingApprovals}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Waiting for admin approval
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
