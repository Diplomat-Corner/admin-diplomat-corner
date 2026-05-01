"use client";

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviewQuery } from "@/hooks/queries/use-reviews";

interface ReviewDetailsProps {
  reviewId: string;
}

interface Review {
  _id: string;
  userId: string;
  targetUserId: string;
  productId: string;
  rating: number;
  comment: string;
  likes: string[];
  user: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export function ReviewDetails({ reviewId }: ReviewDetailsProps) {
  const { data: review, isLoading } = useReviewQuery<Review>(reviewId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-sm text-gray-500">
        Review not found or has been deleted
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-md">
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <Badge variant="outline">
          {review.user?.firstName} {review.user?.lastName}
        </Badge>
      </div>
      <p className="text-sm text-gray-600">{review.comment}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Product ID: {review.productId}</span>
        <span>•</span>
        <span>Target User: {review.targetUserId}</span>
      </div>
    </div>
  );
}
