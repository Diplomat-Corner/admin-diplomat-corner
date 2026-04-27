import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface TrackingItem {
  userId: string;
  timestamp: string;
  device?: string;
  ipAddress?: string;
}

interface AnalyticsDataPoint {
  date: string;
  count: number;
  items: TrackingItem[];
}

interface AdvertisementAnalyticsProps {
  advertisementId: string;
  title?: string;
}

function parseEventTimestamp(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") {
    const t = new Date(raw);
    return Number.isNaN(t.getTime()) ? "" : t.toISOString().slice(0, 10);
  }
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? "" : raw.toISOString().slice(0, 10);
  }
  return "";
}

/** Client-side series when API returns legacy `views` / `clicks` without nested `analytics`. */
function buildOverTimeFromEvents(raw: unknown): AnalyticsDataPoint[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const byDate = new Map<string, TrackingItem[]>();
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const ev = e as Record<string, unknown>;
    const date = parseEventTimestamp(ev.timestamp);
    if (!date) continue;
    const item: TrackingItem = {
      userId: String(ev.userId ?? ""),
      timestamp:
        typeof ev.timestamp === "string"
          ? ev.timestamp
          : String(ev.timestamp ?? ""),
      device: typeof ev.device === "string" ? ev.device : undefined,
      ipAddress: typeof ev.ipAddress === "string" ? ev.ipAddress : undefined,
    };
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(item);
  }
  return Array.from(byDate.entries())
    .map(([date, items]) => ({ date, count: items.length, items }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeAnalytics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): {
  viewCount: number;
  clickCount: number;
  viewsOverTime: AnalyticsDataPoint[];
  clicksOverTime: AnalyticsDataPoint[];
} {
  const a = data?.analytics;
  if (a && typeof a === "object" && a !== null && !Array.isArray(a)) {
    return {
      viewCount: Number(a.viewCount ?? 0),
      clickCount: Number(a.clickCount ?? 0),
      viewsOverTime: Array.isArray(a.viewsOverTime) ? a.viewsOverTime : [],
      clicksOverTime: Array.isArray(a.clicksOverTime) ? a.clicksOverTime : [],
    };
  }
  const viewsOT = buildOverTimeFromEvents(data?.views);
  const clicksOT = buildOverTimeFromEvents(data?.clicks);
  const vSum = viewsOT.reduce((s, p) => s + p.count, 0);
  const cSum = clicksOT.reduce((s, p) => s + p.count, 0);
  return {
    viewCount: Number(data?.viewCount ?? 0) || vSum,
    clickCount: Number(data?.clickCount ?? 0) || cSum,
    viewsOverTime: viewsOT,
    clicksOverTime: clicksOT,
  };
}

export default function AdvertisementAnalytics({
  advertisementId,
  title,
}: AdvertisementAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    clickCount: number;
    viewCount: number;
    clicksOverTime: AnalyticsDataPoint[];
    viewsOverTime: AnalyticsDataPoint[];
  } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/advertisements/${advertisementId}?analytics=true`
        );

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            typeof errBody.error === "string"
              ? errBody.error
              : `Failed to fetch analytics (HTTP ${response.status})`
          );
        }

        const data = await response.json();
        if (data.success === false) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Analytics request failed"
          );
        }
        setAnalyticsData(normalizeAnalytics(data));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics"
        );
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    if (advertisementId) {
      fetchAnalytics();
    }
  }, [advertisementId]);

  // Format data for charts
  const prepareChartData = (data: AnalyticsDataPoint[] = []) => {
    // Sort data by date
    return [...data].sort((a, b) => a.date.localeCompare(b.date));
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Advertisement Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Advertisement Analytics</CardTitle>
          <CardDescription>Error loading analytics</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  const dataToRender =
    analyticsData ?? {
      viewCount: 0,
      clickCount: 0,
      viewsOverTime: [] as AnalyticsDataPoint[],
      clicksOverTime: [] as AnalyticsDataPoint[],
    };

  const clickChartData = prepareChartData(dataToRender.clicksOverTime);
  const viewChartData = prepareChartData(dataToRender.viewsOverTime);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>
          Advertisement Analytics
          {title && `: ${title}`}
        </CardTitle>
        <CardDescription>
          Performance metrics for this advertisement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 mb-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-2xl font-bold">
                {dataToRender.viewCount}
              </CardTitle>
              <CardDescription>Total Views</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-2xl font-bold">
                {dataToRender.clickCount}
              </CardTitle>
              <CardDescription>Total Clicks</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="views" className="mt-6">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="views">Views Over Time</TabsTrigger>
            <TabsTrigger value="clicks">Clicks Over Time</TabsTrigger>
          </TabsList>

          <TabsContent value="views" className="mt-4">
            <div className="h-80 w-full">
              {viewChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Views" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No view data available
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clicks" className="mt-4">
            <div className="h-80 w-full">
              {clickChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clickChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Clicks" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No click data available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
