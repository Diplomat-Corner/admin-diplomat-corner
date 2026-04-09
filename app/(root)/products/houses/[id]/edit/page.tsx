"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import ManageHouse from "@/components/manage-house";

// Define House type to match the one expected by ManageHouse
interface House {
  _id: string;
  name: string;
  userId: string;
  description: string;
  advertisementType: "Rent" | "Sale";
  price: number;
  paymentMethod?: "Monthly" | "Quarterly" | "Annual";
  bedroom?: number;
  parkingSpace?: number;
  bathroom?: number;
  size?: number;
  houseType: "House" | "Apartment" | "Guest House";
  condition?: string;
  maintenance?: string;
  essentials?: string[];
  currency: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentId: string;
  visibility: "Private" | "Public";
  status: "Pending" | "Active";
}

export default function EditHousePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<House | null>(null);

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/house/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch house");
        }
        const raw = await response.json();
        // GET /api/house/[id] returns { success: true, ...houseFields }
        if (!raw.success || !raw._id) {
          throw new Error(raw.error || "Invalid house response");
        }
        const { success: _ok, ...housePayload } = raw;
        setHouse(housePayload as House);
      } catch (error) {
        console.error("Error fetching house:", error);
        showToast("Failed to load house", "error");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchHouse();
    }
  }, [params.id, showToast]);

  if (loading) {
    return (
      <div className="main-content p-4 md:p-8">
        <MaxWidthWrapper>
          <div className="flex items-center mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-diplomat-green">
              Edit House
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2">Loading house data...</p>
          </div>
        </MaxWidthWrapper>
      </div>
    );
  }

  return (
    <main className="main-content p-4 md:p-8">
      <MaxWidthWrapper>
        {house ? (
          <>
            <div className="flex items-center mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-diplomat-green">
                Edit House: {house.name}
              </h1>
            </div>
            <ManageHouse initialData={house} isEditMode={true} />
          </>
        ) : (
          <div className="p-4 md:p-8">
            <div className="flex items-center mb-6">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold ml-4">House Not Found</h1>
            </div>
            <p>The house you&apos;re trying to edit could not be found.</p>
          </div>
        )}
      </MaxWidthWrapper>
    </main>
  );
}
