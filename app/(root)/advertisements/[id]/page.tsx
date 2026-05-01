"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AdvertisementAnalytics from "@/components/advertisements/advertisement-analytics";
import { trackClick } from "@/lib/utils/advertisement-tracker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IAdvertisement,
  normalizeImageUrls,
  computeAdvertisementEffectiveStatus,
  normalizePublicationStatus,
} from "@/lib/models/advertisement.types";

export default function AdvertisementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [advertisement, setAdvertisement] = useState<IAdvertisement | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        const response = await fetch(`/api/advertisements/${params.id}`);
        const data = await response.json();
        const ad = data?.advertisement ?? (data?._id ? data : null);

        if (response.ok && ad) {
          setAdvertisement(ad);
          setError(null);
        } else {
          const message =
            typeof data?.error === "string" ? data.error : `HTTP ${response.status}`;
          setError(message);
          console.error("Failed to fetch advertisement:", message);
        }
      } catch (error) {
        console.error("Error fetching advertisement:", error);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisement();
  }, [params.id]);

  const handleStatusToggle = async () => {
    if (!advertisement) return;

    try {
      setStatusUpdateLoading(true);

      const pub = normalizePublicationStatus(advertisement.status);
      const newStatus = pub === "Active" ? "Inactive" : "Active";

      const response = await fetch(`/api/advertisements/${advertisement._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update advertisement status");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update status");
      }

      // API now returns the updated doc; older deployments returned only { success: true }.
      if (
        result.advertisement &&
        typeof result.advertisement === "object" &&
        result.advertisement !== null &&
        "_id" in result.advertisement
      ) {
        setAdvertisement(result.advertisement as unknown as IAdvertisement);
      } else {
        setAdvertisement((prev) =>
          prev ? { ...prev, status: newStatus } : prev
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
      // Show error message to user
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!advertisement) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/advertisements/${advertisement._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete advertisement");
      }

      // Redirect to advertisements list
      router.push("/advertisements");
    } catch (err) {
      console.error("Error deleting advertisement:", err);
      // Show error message to user
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleLinkClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!advertisement) return;

    // Track click
    await trackClick(advertisement._id);

    // Open link in new tab
    window.open(advertisement.link, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="main-content space-y-4 p-4 md:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !advertisement) {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const publication = normalizePublicationStatus(advertisement.status);
  const effective =
    advertisement.effectiveStatus ??
    computeAdvertisementEffectiveStatus({
      status: advertisement.status,
      startTime: advertisement.startTime,
      endTime: advertisement.endTime,
    });

  return (
    <div className="main-content space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-diplomat-green">
            {advertisement.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <Badge
              className={
                effective === "Active"
                  ? "bg-green-500"
                  : effective === "Scheduled"
                    ? "bg-blue-500"
                    : effective === "Inactive"
                      ? "bg-yellow-500"
                      : effective === "Expired"
                        ? "bg-red-500"
                        : "bg-gray-500"
              }
            >
              {effective}
            </Badge>
            {publication !== effective && (
              <span className="text-xs text-muted-foreground">
                Publication: {publication}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleStatusToggle}
            disabled={statusUpdateLoading}
            title={
              publication === "Active"
                ? "Deactivate (Inactive)"
                : "Activate (Active)"
            }
          >
            {statusUpdateLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : publication === "Active" ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Advertisement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Live status</h3>
              <Badge
                className={
                  effective === "Active"
                    ? "bg-green-500"
                    : effective === "Scheduled"
                      ? "bg-blue-500"
                      : effective === "Inactive"
                        ? "bg-yellow-500"
                        : effective === "Expired"
                          ? "bg-red-500"
                          : "bg-gray-500"
                }
              >
                {effective}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">
                Publication setting: {publication} (Draft / Active / Inactive).
                Scheduled and Expired are computed from dates when Active.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Priority</h3>
              <Badge variant="outline">{advertisement.priority}</Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Type</h3>
              <p>{advertisement.advertisementType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-gray-700">{advertisement.description}</p>
            </div>
            {advertisement.targetAudience && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Target Audience
                </h3>
                <p className="text-gray-700">{advertisement.targetAudience}</p>
              </div>
            )}
            {advertisement.hashtags && advertisement.hashtags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Hashtags</h3>
                <div className="flex flex-wrap gap-1">
                  {advertisement.hashtags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Views</h3>
              <p className="text-2xl font-bold">{advertisement.viewCount}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Clicks</h3>
              <p className="text-2xl font-bold">{advertisement.clickCount}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Click-through Rate
              </h3>
              <p className="text-2xl font-bold">
                {advertisement.viewCount > 0
                  ? `${(
                      (advertisement.clickCount / advertisement.viewCount) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Advertisement Link
              </h3>
              <a
                href={advertisement.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                {advertisement.link}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {normalizeImageUrls({
        imageUrls: advertisement.imageUrls,
        imageUrl: advertisement.imageUrl,
      }).some((u) => isValidUrl(u)) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {normalizeImageUrls({
                imageUrls: advertisement.imageUrls,
                imageUrl: advertisement.imageUrl,
              })
                .filter((u) => isValidUrl(u))
                .map((url) => (
                  <div
                    key={url}
                    className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={url}
                      alt={`Preview of ${advertisement.title}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Section */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvertisementAnalytics
            advertisementId={advertisement._id}
            title={advertisement.title}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Link href={`/advertisements/${advertisement._id}/edit`}>
          <Button variant="default">
            <Edit className="h-4 w-4 mr-2" />
            Edit Advertisement
          </Button>
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              advertisement and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Reusable component for each detail row
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-semibold">{label}:</span>
      <span className="capitalize">{value}</span>
    </div>
  );
}

// Add this helper function at the bottom of the file
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}
