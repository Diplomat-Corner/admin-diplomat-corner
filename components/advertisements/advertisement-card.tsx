import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  trackClick,
  useAdvertisementView,
} from "@/lib/utils/advertisement-tracker";
import { computeAdvertisementEffectiveStatus } from "@/lib/models/advertisement.types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface AdvertisementCardProps {
  advertisement: {
    _id: string;
    title: string;
    description: string;
    link: string;
    status: string;
    startTime?: string | null;
    endTime?: string | null;
    priority: "High" | "Medium" | "Low";
    advertisementType: string;
    imageUrl?: string;
    imageUrls?: string[];
    clickCount: number;
    viewCount: number;
    hashtags?: string[];
  };
  showAnalytics?: boolean;
  isAdmin?: boolean;
}

export default function AdvertisementCard({
  advertisement,
  showAnalytics = false,
  isAdmin = false,
}: AdvertisementCardProps) {
  const displayStatus = computeAdvertisementEffectiveStatus({
    status: advertisement.status,
    startTime: advertisement.startTime,
    endTime: advertisement.endTime,
  });
  const cover =
    advertisement.imageUrls?.[0] ?? advertisement.imageUrl;
  const [clickCount, setClickCount] = useState(advertisement.clickCount);
  const [isLoading, setIsLoading] = useState(false);

  // Track view when the advertisement is rendered
  useAdvertisementView(advertisement._id);

  // Handle clicking the advertisement link
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newClickCount = await trackClick(advertisement._id);
      if (newClickCount !== null) {
        setClickCount(newClickCount);
      }

      // Open the link in a new tab
      window.open(advertisement.link, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error tracking click:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      {cover && (
        <div className="relative aspect-video w-full">
          <Image
            src={cover}
            alt={advertisement.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge
              variant={
                displayStatus === "Active" ? "default" : "secondary"
              }
            >
              {displayStatus}
            </Badge>
            <Badge variant="outline">{advertisement.priority}</Badge>
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{advertisement.title}</h3>
        <p className="text-gray-600 text-sm mb-3">
          {advertisement.description.length > 100
            ? `${advertisement.description.substring(0, 100)}...`
            : advertisement.description}
        </p>

        {showAnalytics && (
          <div className="flex gap-4 text-sm text-gray-500 mb-3">
            <div>Views: {advertisement.viewCount}</div>
            <div>Clicks: {clickCount}</div>
          </div>
        )}

        {advertisement.hashtags && advertisement.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {advertisement.hashtags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {advertisement.hashtags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{advertisement.hashtags.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button
          variant="default"
          size="sm"
          className="text-xs"
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Visit Link"}
          {!isLoading && <ExternalLink className="ml-1 h-3 w-3" />}
        </Button>

        {isAdmin && (
          <Link href={`/advertisements/${advertisement._id}`}>
            <Button variant="outline" size="sm" className="text-xs">
              Manage
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
