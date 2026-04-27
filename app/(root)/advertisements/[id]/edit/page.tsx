"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvertisementForm } from "@/components/advertisements/advertisement-form";
import type { IAdvertisement } from "@/lib/models/advertisement.types";

export default function EditAdvertisementPage() {
  const params = useParams();
  const router = useRouter();
  const [advertisement, setAdvertisement] = useState<IAdvertisement | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const response = await fetch(`/api/advertisements/${params.id}`);
        const data = await response.json();
        const ad = data?.advertisement ?? (data?._id ? data : null);

        if (response.ok && ad) {
          setAdvertisement(ad);
        } else {
          const message =
            typeof data?.error === "string" ? data.error : `HTTP ${response.status}`;
          console.error("Failed to fetch advertisement:", message);
        }
      } catch (error) {
        console.error("Error fetching advertisement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisement();
  }, [params.id]);

  if (loading) {
    return (
      <div className="main-content space-y-4 p-4 md:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!advertisement) {
    return (
      <div className="main-content space-y-4 p-4 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Advertisement Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content space-y-6 p-4 md:p-8">
      <header className="mx-auto flex w-full max-w-4xl items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="shrink-0 pt-1"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-diplomat-green">
            Edit advertisement
          </h1>
          <p className="text-sm text-muted-foreground">
            Use the same steps to change copy, visuals, link, and schedule.
          </p>
        </div>
      </header>

      <AdvertisementForm
        initialData={advertisement}
        mode="edit"
        onSuccess={() => router.push(`/advertisements/${params.id}`)}
      />
    </div>
  );
}
