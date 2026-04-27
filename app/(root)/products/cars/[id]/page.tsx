"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
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

interface Car {
  _id: string;
  name: string;
  userId: string;
  description: string;
  advertisementType: "Rent" | "Sale";
  price: number;
  paymentMethod: string;
  year: number;
  mileage: number;
  speed: number;
  milesPerGallon: number;
  transmission: string;
  fuel: string;
  bodyType: string;
  condition: string;
  engine: string;
  maintenance: string;
  currency: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  paymentId: string;
  visiblity: "Private" | "Public";
  status: "Pending" | "Active";
  tags?: string;
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

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [car, setCar] = useState<Car | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cars/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch car");
        }

        const result = await response.json();

        // Check if the API response has the expected format
        if (!result.success) {
          throw new Error(result.error || "Invalid response from server");
        }

        // Get the car data from the response
        const carData = result.car;

        if (!carData || !carData._id) {
          throw new Error("Invalid car data received");
        }

        setCar(carData);

        // Fetch payment details if paymentId exists
        if (carData.paymentId) {
          // Check if car was created by admin (paymentId starts with "admin-created")
          if (carData.paymentId.startsWith("admin-created")) {
            // Set a special payment object for admin-created cars
            setPayment({
              _id: "admin-payment",
              paymentId: carData.paymentId,
              servicePrice: 0,
              receiptUrl: "",
              uploadedAt: carData.createdAt || new Date().toISOString(),
              productId: carData._id,
              productType: "car",
              userId: "admin",
              createdAt: carData.createdAt,
              updatedAt: carData.updatedAt,
            });
          } else {
            try {
              const paymentResponse = await fetch(
                `/api/payment/${carData.paymentId}`
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
                  paymentId: carData.paymentId,
                  servicePrice: 0,
                  receiptUrl: "",
                  uploadedAt: carData.createdAt || new Date().toISOString(),
                  productId: carData._id,
                  productType: "car",
                  userId: "unknown",
                  createdAt: carData.createdAt,
                  updatedAt: carData.updatedAt,
                });
              }
            } catch (error) {
              console.error("Error fetching payment:", error);
              // Set a placeholder payment for failed payment fetches
              setPayment({
                _id: "error",
                paymentId: carData.paymentId,
                servicePrice: 0,
                receiptUrl: "",
                uploadedAt: carData.createdAt || new Date().toISOString(),
                productId: carData._id,
                productType: "car",
                userId: "error",
                createdAt: carData.createdAt,
                updatedAt: carData.updatedAt,
              });
            }
          }
        } else {
          // No paymentId, set a default payment object for admin-created cars
          setPayment({
            _id: "admin-created",
            paymentId: "admin-created",
            servicePrice: 0,
            receiptUrl: "",
            uploadedAt: carData.createdAt || new Date().toISOString(),
            productId: carData._id,
            productType: "car",
            userId: "admin",
            createdAt: carData.createdAt,
            updatedAt: carData.updatedAt,
          });
        }
      } catch (error) {
        console.error("Error fetching car:", error);
        showToast("Failed to load car", "error");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCarDetails();
    }
  }, [params.id, showToast]);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);

      const response = await fetch(`/api/cars/${car?._id}?isAdmin=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete car");
      }

      showToast("Car deleted successfully", "success");
      router.push("/products/cars");
    } catch (error) {
      console.error("Error deleting car:", error);
      showToast("Failed to delete car", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (newStatus: "Pending" | "Active") => {
    try {
      if (!car) return;

      setStatusUpdateLoading(true);

      const response = await fetch(`/api/cars/${car._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      // Check if the response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result?.error || `Server error: ${response.status}`
            );
          }

          // Success - update the car data with the response
          if (result?.car) {
            setCar(result.car);
            showToast(`Car status updated to ${newStatus}`, "success");
          } else {
            // If for some reason the API didn't return the updated car, fetch it
            await refreshCarData(car._id);
          }
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        // Handle non-JSON response (likely HTML error page)
        const text = await response.text();
        console.error(
          "Server returned non-JSON response:",
          text.substring(0, 100) + "..."
        );
        throw new Error("Server error. Response was not in JSON format.");
      }
    } catch (error) {
      console.error("Error updating car status:", error);
      showToast(
        `Failed to update car status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Helper function to refresh car data
  const refreshCarData = async (carId: string) => {
    try {
      const updatedResponse = await fetch(`/api/cars/${carId}`);
      const contentType = updatedResponse.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await updatedResponse.json();
        const carPayload = data.car ?? data;
        if (data.success && carPayload?._id) {
          setCar(carPayload);
          showToast(`Car status updated successfully`, "success");
        } else {
          throw new Error("Invalid car data format in response");
        }
      } else {
        throw new Error("Invalid response format when fetching updated car");
      }
    } catch (fetchError) {
      console.error("Error fetching updated car:", fetchError);
      showToast(
        "Car status was updated, but we couldn't refresh the view. Please reload the page.",
        "info"
      );
    }
  };

  if (loading) {
    return (
      <div className="main-content p-3">
        <div className="flex items-center mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Loading car data...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="main-content p-3">
        <div className="flex items-center mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold ml-3">Car Not Found</h1>
        </div>
        <p>The car you&apos;re trying to view could not be found.</p>
      </div>
    );
  }

  return (
    <div className="main-content p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Link href="/products/cars">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex ml-3">
            <h1 className="text-xl font-bold text-diplomat-green px-2">
              {car.name}
            </h1>
            <div className="flex items-center mt-1">
              <Badge
                className={
                  car.status === "Active" ? "bg-green-500" : "bg-yellow-500"
                }
              >
                {car.status}
              </Badge>
              <span className="ml-2 text-sm text-muted-foreground">
                {car.bodyType} • {car.year} •{" "}
                {car.advertisementType === "Sale" ? "For Sale" : "For Rent"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {car.status === "Pending" ? (
            <>
              <Button
                variant="outline"
                className="text-red-500 border-red-500 hover:bg-red-50"
                onClick={() => handleStatusChange("Pending")}
                size="sm"
                disabled={statusUpdateLoading}
              >
                {statusUpdateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="ml-1">Reject</span>
              </Button>
              <Button
                variant="default"
                className="bg-green-500 hover:bg-green-600"
                onClick={() => handleStatusChange("Active")}
                size="sm"
                disabled={statusUpdateLoading}
              >
                {statusUpdateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span className="ml-1">Approve</span>
              </Button>
            </>
          ) : (
            <>
              <Link href={`/products/cars/${car._id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                  <span className="ml-1">Edit</span>
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-1">Delete</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {/* Overview Section - Takes 1/3 of the screen on desktop */}
        <Card className="md:col-span-1">
          <CardHeader className="p-3">
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-medium text-sm">Price</h3>
                <p className="text-muted-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: car.currency || "USD",
                  }).format(car.price)}
                  {car.advertisementType === "Rent" &&
                    ` / ${car.paymentMethod}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h3 className="font-medium text-sm">Year</h3>
                  <p className="text-muted-foreground">{car.year}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Mileage</h3>
                  <p className="text-muted-foreground">{car.mileage} mi</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Transmission</h3>
                  <p className="text-muted-foreground">{car.transmission}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Fuel</h3>
                  <p className="text-muted-foreground">{car.fuel}</p>
                </div>
              </div>

              {car.engine && (
                <div>
                  <h3 className="font-medium text-sm">Engine</h3>
                  <p className="text-muted-foreground">{car.engine}</p>
                </div>
              )}

              {car.condition && (
                <div>
                  <h3 className="font-medium text-sm">Condition</h3>
                  <p className="text-muted-foreground">{car.condition}</p>
                </div>
              )}

              {/* Listing Information */}
              <div className="border-t pt-2 mt-2">
                <h3 className="font-medium text-sm">Listing Details</h3>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-muted-foreground">
                      {car.createdAt
                        ? new Date(car.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-muted-foreground">{car.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Section - Takes 2/3 of the screen on desktop */}
        <div className="md:col-span-2 space-y-3">
          {/* Car Image and Description */}
          <Card>
            <CardContent className="p-3">
              <div className="grid gap-3 md:grid-cols-2">
                {/* Image Gallery - Display multiple images if available */}
                <div>
                  {car.imageUrls && car.imageUrls.length > 0 ? (
                    <div className="space-y-2">
                      {/* Main Image */}
                      <div className="relative aspect-video rounded-md overflow-hidden border">
                        <Image
                          src={car.imageUrls[0]}
                          alt={car.name}
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>

                      {/* Thumbnails Row */}
                      {car.imageUrls.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {car.imageUrls.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                // Move this image to the first position (could implement more sophisticated gallery)
                                const newImageUrls = [...car.imageUrls!];
                                const clickedImg = newImageUrls.splice(
                                  idx,
                                  1
                                )[0];
                                newImageUrls.unshift(clickedImg);
                                setCar({ ...car, imageUrls: newImageUrls });
                              }}
                            >
                              <Image
                                src={imgUrl}
                                alt={`${car.name} - Image ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : car.imageUrl ? (
                    <div className="relative aspect-video rounded-md overflow-hidden border">
                      <Image
                        src={car.imageUrl}
                        alt={car.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full aspect-video flex items-center justify-center bg-gray-100 rounded-md">
                      <p className="text-gray-500">No image</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-sm mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {car.description}
                  </p>

                  {car.tags && (
                    <div className="mt-2">
                      <h3 className="font-medium text-sm">Tags</h3>
                      <p className="text-sm text-muted-foreground">
                        {car.tags}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {payment && (
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-base">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {/* Special display for admin-created cars */}
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
                        This listing was created by a Diplomat Corner
                        administrator
                      </p>
                      {car.createdAt && (
                        <p className="text-xs text-blue-500 mt-1">
                          Creation date:{" "}
                          {new Date(car.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <h3 className="font-medium text-sm">Payment ID</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {payment.paymentId}
                          </p>
                        </div>

                        {payment.servicePrice > 0 && (
                          <div>
                            <h3 className="font-medium text-sm">
                              Service Price
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: car?.currency || "USD",
                              }).format(payment.servicePrice)}
                            </p>
                          </div>
                        )}
                      </div>

                      {payment.uploadedAt && (
                        <div>
                          <h3 className="font-medium text-sm">Payment Date</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {payment.receiptUrl && (
                      <div>
                        <h3 className="font-medium text-sm mb-1">Receipt</h3>
                        <div className="relative aspect-[3/4] border rounded-md overflow-hidden h-32">
                          <Image
                            src={payment.receiptUrl}
                            alt="Receipt"
                            fill
                            className="object-contain"
                            priority
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 h-7 text-xs px-2 py-0"
                          asChild
                        >
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Full Receipt
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional car specs that might need to be shown */}
          {(car.speed > 0 || car.milesPerGallon > 0 || car.maintenance) && (
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-base">
                  Additional Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {car.speed > 0 && (
                    <div>
                      <h3 className="font-medium text-sm">Speed</h3>
                      <p className="text-sm text-muted-foreground">
                        {car.speed} mph
                      </p>
                    </div>
                  )}
                  {car.milesPerGallon > 0 && (
                    <div>
                      <h3 className="font-medium text-sm">MPG</h3>
                      <p className="text-sm text-muted-foreground">
                        {car.milesPerGallon}
                      </p>
                    </div>
                  )}
                  {car.maintenance && (
                    <div>
                      <h3 className="font-medium text-sm">Maintenance</h3>
                      <p className="text-sm text-muted-foreground">
                        {car.maintenance}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the car
              and all associated data (reviews, payments, etc).
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
