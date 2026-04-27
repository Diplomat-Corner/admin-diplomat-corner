"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ImageIcon, Plus, Users } from "lucide-react";
import { AdvertisementsTable } from "@/components/admin/advertisements-table";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { computeAdvertisementEffectiveStatus } from "@/lib/models/advertisement.types";

interface Advertisement {
  _id: string;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
  effectiveStatus?: string;
  viewCount: number;
  clickCount: number;
}

// Skeleton loaders
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
      </CardContent>
    </Card>
  );
}

export default function AdvertisementsPage() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    impressions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdvertisementStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/advertisements");
        const data = await response.json();

        if (data.success && data.advertisements) {
          // Calculate stats
          const advertisements: Advertisement[] = data.advertisements;
          const active = advertisements.filter((ad) => {
            const eff =
              ad.effectiveStatus ??
              computeAdvertisementEffectiveStatus({
                status: ad.status,
                startTime: ad.startTime,
                endTime: ad.endTime,
              });
            return eff === "Active";
          }).length;
          const scheduled = advertisements.filter((ad) => {
            const eff =
              ad.effectiveStatus ??
              computeAdvertisementEffectiveStatus({
                status: ad.status,
                startTime: ad.startTime,
                endTime: ad.endTime,
              });
            return eff === "Scheduled";
          }).length;
          const totalViews = advertisements.reduce(
            (sum: number, ad: Advertisement) => sum + (ad.viewCount || 0),
            0
          );

          setStats({
            total: advertisements.length,
            active,
            scheduled,
            impressions: totalViews,
          });
        }
      } catch (error) {
        console.error("Error fetching advertisement stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvertisementStats();
  }, []);

  return (
    <div className="main-content space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-diplomat-green">
          Advertisements
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/advertisements/create">
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Create Advertisement
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Ads</TabsTrigger>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="Draft">Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Ads
                    </CardTitle>
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Ads
                    </CardTitle>
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.active}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Scheduled Ads
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.scheduled}</div>
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
                    <div className="text-2xl font-bold">
                      {stats.impressions > 1000
                        ? `${(stats.impressions / 1000).toFixed(1)}K`
                        : stats.impressions}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <AdvertisementsTable />
        </TabsContent>
        <TabsContent value="Active" className="space-y-4">
          <AdvertisementsTable effectiveStatus="Active" />
        </TabsContent>
        <TabsContent value="Scheduled" className="space-y-4">
          <AdvertisementsTable effectiveStatus="Scheduled" />
        </TabsContent>
        <TabsContent value="Draft" className="space-y-4">
          <AdvertisementsTable publicationStatus="Draft" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
