"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Home, Plus, Package, Loader2 } from "lucide-react";
import { ProductsTable, type Product } from "@/components/admin/products-table";
import { ProductCard } from "@/components/admin/products-card";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { sortListingsLatestFirst } from "@/lib/listings/listing-recency";

interface ProductStats {
  total: number;
  houses: number;
  cars: number;
  pending: number;
}

// Interfaces for API responses
interface CarsApiResponse {
  success: boolean;
  cars: CarData[];
}

interface CarData {
  _id: string;
  name: string;
  status: "Pending" | "Active" | "Inactive";
  price: number;
  advertisementType?: "Sale" | "Rent";
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface HouseData {
  _id: string;
  name: string;
  status: "Pending" | "Active" | "Inactive";
  price: number;
  advertisementType?: "Sale" | "Rent";
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export default function Page() {
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    houses: 0,
    cars: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const fetchProductStats = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both cars and houses data
      const [carsResponse, housesResponse] = await Promise.all([
        fetch("/api/cars"),
        fetch("/api/house"),
      ]);

      if (!carsResponse.ok || !housesResponse.ok) {
        throw new Error("Failed to fetch product data");
      }

      const carsData = (await carsResponse.json()) as CarsApiResponse;
      const housesData = (await housesResponse.json()) as HouseData[];

      // Handle different response structures
      const cars = (carsData.success ? carsData.cars : []).map(
        (car: CarData) => ({ ...car, type: "car" as const })
      );
      const houses = (Array.isArray(housesData) ? housesData : []).map(
        (house: HouseData) => ({ ...house, type: "house" as const })
      );

      // Calculate stats
      const total = cars.length + houses.length;
      const pendingCars = cars.filter((car) => car.status === "Pending").length;
      const pendingHouses = houses.filter(
        (house) => house.status === "Pending"
      ).length;

      setStats({
        total,
        houses: houses.length,
        cars: cars.length,
        pending: pendingCars + pendingHouses,
      });
      setAllProducts(
        sortListingsLatestFirst([...houses, ...cars] as Product[])
      );
    } catch (error) {
      console.error("Error fetching product statistics:", error);
      setStats({
        total: 0,
        houses: 0,
        cars: 0,
        pending: 0,
      });
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductStats();
  }, [fetchProductStats]);

  return (
    <div className="main-content main-content-expanded space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-diplomat-green">
          Products
        </h1>
        <div className="flex gap-2">
          <Button variant="default" asChild>
            <Link href="/products/houses/manage">
              <Plus className="mr-2 h-4 w-4" />
              Add House
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href="/products/cars/manage">
              <Plus className="mr-2 h-4 w-4" />
              Add Car
            </Link>
          </Button>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="w-full justify-start border-b pb-px mb-4">
          <TabsTrigger value="all" className="px-4 py-2">
            All Products
          </TabsTrigger>
          <TabsTrigger value="houses" className="px-4 py-2">
            Houses
          </TabsTrigger>
          <TabsTrigger value="cars" className="px-4 py-2">
            Cars
          </TabsTrigger>
          <TabsTrigger value="pending" className="px-4 py-2">
            Pending Approval
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ProductCard
              id="total"
              title="Total Products"
              value={
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.total.toString()
                )
              }
              icon={<Package className="h-4 w-4 text-muted-foreground" />}
              type="all"
            />
            <ProductCard
              id="houses"
              title="Houses"
              value={
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.houses.toString()
                )
              }
              icon={<Home className="h-4 w-4 text-muted-foreground" />}
              type="house"
            />
            <ProductCard
              id="cars"
              title="Cars"
              value={
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.cars.toString()
                )
              }
              icon={<Car className="h-4 w-4 text-muted-foreground" />}
              type="car"
            />
            <ProductCard
              id="pending"
              title="Pending Approval"
              value={
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stats.pending.toString()
                )
              }
              icon={<Package className="h-4 w-4 text-muted-foreground" />}
              type="all"
            />
          </div>
          <ProductsTable data={allProducts} />
        </TabsContent>
        <TabsContent value="houses" className="space-y-4">
          <ProductsTable type="house" />
        </TabsContent>
        <TabsContent value="cars" className="space-y-4">
          <ProductsTable type="car" />
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Houses</h2>
            <ProductsTable type="house" pending={true} />
            <h2 className="text-xl font-semibold">Pending Cars</h2>
            <ProductsTable type="car" pending={true} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
