"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

interface House {
  _id: string;
  name: string;
  userId: string;
  description: string;
  advertisementType: "Rent" | "Sale";
  price: number;
  paymentMethod: "Monthly" | "Quarterly" | "Annual";
  bedroom: number;
  parkingSpace: number;
  bathroom: number;
  size: number;
  houseType: "House" | "Apartment" | "Guest House";
  condition: string;
  maintenance: string;
  essentials: string[];
  currency: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  paymentId: string;
  visiblity: "Private" | "Public";
  status: "Pending" | "Active";
}

interface Payment {
  _id: string;
  paymentId: string;
  servicePrice: number;
  receiptUrl: string;
  uploadedAt: string;
  productId: string;
  productType: "house" | "car";
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function HouseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [house, setHouse] = useState<House | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHouseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/house/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch house details");
        }
        const raw = await response.json();
        // GET /api/house/[id] returns { success: true, ...houseFields }
        if (!raw.success || !raw._id) {
          throw new Error(raw.error || "Invalid house response");
        }
        const { success: _s, ...housePayload } = raw;
        setHouse(housePayload as House);

        // Fetch payment details if paymentId exists
        if (housePayload.paymentId) {
          // Check if house was created by admin (paymentId starts with "admin-created")
          if (housePayload.paymentId.startsWith("admin-created")) {
            // Set a special payment object for admin-created houses
            setPayment({
              _id: "admin-payment",
              paymentId: housePayload.paymentId,
              servicePrice: 0,
              receiptUrl: "",
              uploadedAt: housePayload.createdAt || new Date().toISOString(),
              productId: housePayload._id,
              productType: "house",
              userId: "admin",
              createdAt: housePayload.createdAt,
              updatedAt: housePayload.updatedAt,
            });
          } else {
            try {
              const paymentResponse = await fetch(
                `/api/payment/${housePayload.paymentId}`
              );
              if (paymentResponse.ok) {
                const paymentData = await paymentResponse.json();
                setPayment(paymentData);
              } else {
                console.error(
                  "Failed to fetch payment:",
                  await paymentResponse.text()
                );
                // Set a placeholder payment for failed payment fetches
                setPayment({
                  _id: "unknown",
                  paymentId: housePayload.paymentId,
                  servicePrice: 0,
                  receiptUrl: "",
                  uploadedAt:
                    housePayload.createdAt || new Date().toISOString(),
                  productId: housePayload._id,
                  productType: "house",
                  userId: "unknown",
                  createdAt: housePayload.createdAt,
                  updatedAt: housePayload.updatedAt,
                });
              }
            } catch (error) {
              console.error("Error fetching payment:", error);
              // Set a placeholder payment for failed payment fetches
              setPayment({
                _id: "error",
                paymentId: housePayload.paymentId,
                servicePrice: 0,
                receiptUrl: "",
                uploadedAt:
                  housePayload.createdAt || new Date().toISOString(),
                productId: housePayload._id,
                productType: "house",
                userId: "error",
                createdAt: housePayload.createdAt,
                updatedAt: housePayload.updatedAt,
              });
            }
          }
        } else {
          // No paymentId, set a default payment object for admin-created houses
          setPayment({
            _id: "admin-created",
            paymentId: "admin-created",
            servicePrice: 0,
            receiptUrl: "",
            uploadedAt: housePayload.createdAt || new Date().toISOString(),
            productId: housePayload._id,
            productType: "house",
            userId: "admin",
            createdAt: housePayload.createdAt,
            updatedAt: housePayload.updatedAt,
          });
        }
      } catch (error) {
        console.error("Error fetching house details:", error);
        showToast("Failed to load house details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchHouseDetails();
    }
  }, [params.id, showToast]);

  const handleStatusChange = async (newStatus: "Pending" | "Active") => {
    try {
      const response = await fetch(`/api/house/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update house status");
      }

      showToast(`House status updated to ${newStatus}`, "success");

      // Refresh house details
      const updatedResponse = await fetch(`/api/house/${params.id}`);
      if (updatedResponse.ok) {
        const updated = await updatedResponse.json();
        if (updated.success && updated._id) {
          const { success: _s, ...housePayload } = updated;
          setHouse(housePayload as House);
        }
      }
    } catch (error) {
      console.error("Error updating house status:", error);
      showToast("Failed to update house status", "error");
    }
  };

  if (loading) {
    return (
      <div className="main-content p-4 md:p-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="text-center">Loading house details...</div>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="main-content p-4 md:p-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="text-center">House not found</div>
      </div>
    );
  }

  return (
    <div className="main-content p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {house.status === "Pending" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-red-500 border-red-500 hover:bg-red-50"
              onClick={() => handleStatusChange("Pending")}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => handleStatusChange("Active")}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{house.name}</CardTitle>
              <Badge
                className={
                  house.status === "Active" ? "bg-green-500" : "bg-yellow-500"
                }
              >
                {house.status}
              </Badge>
            </div>
            <CardDescription>
              {house.houseType} • {house.advertisementType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add image gallery */}
              {house.imageUrls && house.imageUrls.length > 0 ? (
                <div className="space-y-2">
                  {/* Main Image */}
                  <div className="relative w-full h-64 border rounded-md overflow-hidden bg-gray-50">
                    <Image
                      src={house.imageUrls[0]}
                      alt={house.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  {/* Thumbnails Row for multiple images */}
                  {house.imageUrls.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {house.imageUrls.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            // Move this image to the first position
                            const newImageUrls = [...house.imageUrls!];
                            const clickedImg = newImageUrls.splice(idx, 1)[0];
                            newImageUrls.unshift(clickedImg);
                            setHouse({ ...house, imageUrls: newImageUrls });
                          }}
                        >
                          <Image
                            src={imgUrl}
                            alt={`${house.name} - Image ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : house.imageUrl ? (
                <div className="relative w-full h-64 border rounded-md overflow-hidden bg-gray-50">
                  <Image
                    src={house.imageUrl}
                    alt={house.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full h-64 border rounded-md flex items-center justify-center bg-gray-100">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}

              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {house.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Price</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: house.currency || "USD",
                    }).format(house.price)}
                    {house.advertisementType === "Rent" &&
                      ` / ${house.paymentMethod}`}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Size</h3>
                  <p className="text-sm text-muted-foreground">
                    {house.size} sq ft
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Bedrooms</h3>
                  <p className="text-sm text-muted-foreground">
                    {house.bedroom}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Bathrooms</h3>
                  <p className="text-sm text-muted-foreground">
                    {house.bathroom}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Parking Spaces</h3>
                  <p className="text-sm text-muted-foreground">
                    {house.parkingSpace}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Condition</h3>
                  <p className="text-sm text-muted-foreground">
                    {house.condition || "N/A"}
                  </p>
                </div>
              </div>

              {house.essentials && house.essentials.length > 0 && (
                <div>
                  <h3 className="font-medium">Essentials</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {house.essentials.map((item, index) => (
                      <Badge key={index} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {house.maintenance && (
                <div>
                  <h3 className="font-medium">Maintenance</h3>
                  <p className="text-sm text-muted-foreground">
                    {house.maintenance}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Created: {new Date(house.createdAt || "").toLocaleDateString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Updated: {new Date(house.updatedAt || "").toLocaleDateString()}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Payment details for this listing</CardDescription>
          </CardHeader>
          <CardContent>
            {payment ? (
              <div className="space-y-4">
                {/* Special display for admin-created houses */}
                {payment.userId === "admin" ||
                payment.paymentId.startsWith("admin-created") ? (
                  <div className="bg-blue-50 p-3 rounded-md flex items-center border border-blue-100">
                    <div className="p-2 rounded-full bg-blue-100 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-500"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-blue-700">
                        Added by Administrator
                      </h3>
                      <p className="text-xs text-blue-600">
                        This property listing was created by a Diplomat Corner
                        administrator
                      </p>
                      {house.createdAt && (
                        <p className="text-xs text-blue-500 mt-1">
                          Creation date:{" "}
                          {new Date(house.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Amount</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: house.currency || "USD",
                        }).format(payment.servicePrice)}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Payment ID</h3>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentId}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Product Type</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {payment.productType}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Uploaded</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {payment.receiptUrl &&
                  !payment.paymentId.startsWith("admin-created") &&
                  payment.userId !== "admin" && (
                    <div>
                      <h3 className="font-medium mb-2">Payment Receipt</h3>
                      <div className="relative w-full h-80 border rounded-md overflow-hidden bg-gray-50">
                        <Image
                          src={payment.receiptUrl}
                          alt="Payment Receipt"
                          fill
                          className="object-contain"
                          priority
                          onError={(e) => {
                            console.error("Error loading receipt image");
                            // Fallback to a placeholder or show an error message
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View full receipt
                        </a>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payment information available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
