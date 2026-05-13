"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Check, Home, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { IHouse } from "@/lib/models/house.model";
import { ICar } from "@/lib/models/car.model";
import { useToast } from "@/components/ui/toast";
import { sortListingsLatestFirst } from "@/lib/listings/listing-recency";

interface RecentListingsProps {
  houses: IHouse[];
  cars: ICar[];
}

export function RecentListings({ houses, cars }: RecentListingsProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const allListings = sortListingsLatestFirst([
    ...houses.map((house) => ({ ...house, type: "house" as const })),
    ...cars.map((car) => ({ ...car, type: "car" as const })),
  ]).slice(0, 4);

  const handleApprove = async (id: string, type: 'house' | 'car') => {
    try {
      const endpoint = type === 'house' ? 'house' : 'cars';
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Active' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve listing');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to approve listing');
      }

      showToast('Listing approved successfully', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error approving listing:', error);
      showToast(error instanceof Error ? error.message : 'Failed to approve listing', 'error');
    }
  };

  const handleReject = async (id: string, type: 'house' | 'car') => {
    try {
      const endpoint = type === 'house' ? 'house' : 'cars';
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Pending' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject listing');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reject listing');
      }

      showToast('Listing rejected successfully', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error rejecting listing:', error);
      showToast(error instanceof Error ? error.message : 'Failed to reject listing', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {allListings.map((listing) => (
        <div key={listing._id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder.svg" alt={listing.type === 'house' ? 'House' : 'Car'} />
            <AvatarFallback>
              {listing.type === 'house' ? <Home className="h-4 w-4" /> : <Car className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{listing.name}</p>
            <p className="text-sm text-muted-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: listing.currency || "USD",
              }).format(listing.price)}
              {listing.advertisementType === "Rent" && ` / ${listing.paymentMethod}`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="ml-auto">
              {listing.type === 'house' ? 'House' : 'Car'}
            </Badge>
            <Badge className={listing.status === "Active" ? "bg-green-500" : "bg-yellow-500"}>
              {listing.status}
            </Badge>
            {listing.status === "Pending" && (
              <>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => handleApprove(listing._id, listing.type)}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => handleReject(listing._id, listing.type)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
