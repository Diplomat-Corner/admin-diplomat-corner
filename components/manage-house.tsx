"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

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
  imageUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  paymentId: string;
  visibility: "Private" | "Public";
  status: "Pending" | "Active";
}

interface HouseFormData {
  name: string;
  bedroom: number;
  size: number;
  bathroom: number;
  parkingSpace: number;
  condition: string;
  maintenance: string;
  price: number;
  description: string;
  advertisementType: "Rent" | "Sale";
  paymentMethod: "Monthly" | "Quarterly" | "Annual";
  houseType: "House" | "Apartment" | "Guest House";
  essentials: string[];
  currency: string;
}

interface ManageHouseProps {
  initialData?: House;
  isEditMode?: boolean;
}

const ManageHouse: React.FC<ManageHouseProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Update for multiple files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.imageUrls ||
      (initialData?.imageUrl ? [initialData.imageUrl] : [])
  );
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [replaceImages, setReplaceImages] = useState(false);

  useEffect(() => {
    // Reset removedImageUrls when replaceImages is toggled to true
    if (replaceImages) {
      setRemovedImageUrls([]);
    }
  }, [replaceImages]);

  const [formData, setFormData] = useState<HouseFormData>({
    name: initialData?.name || "",
    bedroom: initialData?.bedroom || 0,
    size: initialData?.size || 0,
    bathroom: initialData?.bathroom || 0,
    parkingSpace: initialData?.parkingSpace || 0,
    condition: initialData?.condition || "",
    maintenance: initialData?.maintenance || "",
    price: initialData?.price || 0,
    description: initialData?.description || "",
    advertisementType: initialData?.advertisementType || "Rent",
    paymentMethod: initialData?.paymentMethod || "Monthly",
    houseType: initialData?.houseType || "House",
    essentials: initialData?.essentials || [],
    currency: initialData?.currency || "USD",
  });

  // Load saved form data from session storage if available
  useEffect(() => {
    if (!isEditMode) {
      try {
        const savedData = sessionStorage.getItem("manageHouse-formData");
        const savedPreviews = sessionStorage.getItem(
          "manageHouse-imagePreviews"
        );

        if (savedData) {
          setFormData(JSON.parse(savedData));
        }

        if (savedPreviews) {
          setImagePreviews(JSON.parse(savedPreviews));
        }
      } catch (error) {
        console.error("Error loading form data from session storage:", error);
      }
    }
  }, [isEditMode]);

  // Save form data to session storage when it changes
  useEffect(() => {
    if (!isEditMode) {
      try {
        sessionStorage.setItem(
          "manageHouse-formData",
          JSON.stringify(formData)
        );
        sessionStorage.setItem(
          "manageHouse-imagePreviews",
          JSON.stringify(imagePreviews)
        );
      } catch (error) {
        console.error("Error saving form data to session storage:", error);
      }
    }
  }, [formData, imagePreviews, isEditMode]);

  const essentials = [
    "WiFi",
    "Furnished",
    "Play Ground",
    "Living Area",
    "Gym",
    "Outdoor",
    "Dining Area",
    "Jacuzzi",
    "Steam",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "bedroom" ||
        name === "size" ||
        name === "bathroom" ||
        name === "parkingSpace" ||
        name === "price"
          ? Number(value)
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update file handling for multiple files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => (replaceImages ? files : [...prev, ...files]));

      // Generate previews for all selected files
      const newPreviews: string[] = [];

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setImagePreviews((prev) =>
              replaceImages ? newPreviews : [...prev, ...newPreviews]
            );
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Add a function to remove an image
  const handleRemoveImage = (index: number) => {
    // Check if this is an original image URL (vs a newly added file)
    const removedPreview = imagePreviews[index];

    if (
      isEditMode &&
      initialData?.imageUrls &&
      initialData.imageUrls.includes(removedPreview)
    ) {
      // It's an original image URL - add to removedImageUrls array
      setRemovedImageUrls((prev) => [...prev, removedPreview]);
    }

    // Remove from preview and selected files
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleEssential = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      essentials: prev.essentials.includes(item)
        ? prev.essentials.filter((i) => i !== item)
        : [...prev.essentials, item],
    }));
  };

  const resetForm = () => {
    // Clear session storage when resetting form
    if (!isEditMode) {
      try {
        sessionStorage.removeItem("manageHouse-formData");
        sessionStorage.removeItem("manageHouse-imagePreviews");
      } catch (error) {
        console.error("Error clearing session storage:", error);
      }
    }

    if (initialData && isEditMode) {
      // Reset to initial data in edit mode
      setFormData({
        name: initialData.name,
        bedroom: initialData.bedroom || 0,
        size: initialData.size || 0,
        bathroom: initialData.bathroom || 0,
        parkingSpace: initialData.parkingSpace || 0,
        condition: initialData.condition || "",
        maintenance: initialData.maintenance || "",
        price: initialData.price,
        description: initialData.description,
        advertisementType: initialData.advertisementType,
        paymentMethod: initialData.paymentMethod || "Monthly",
        houseType: initialData.houseType,
        essentials: initialData.essentials || [],
        currency: initialData.currency,
      });
      setImagePreviews(
        initialData.imageUrls ||
          (initialData.imageUrl ? [initialData.imageUrl] : [])
      );
      setSelectedFiles([]);
    } else {
      // Reset to empty form in create mode
      setFormData({
        name: "",
        bedroom: 0,
        size: 0,
        bathroom: 0,
        parkingSpace: 0,
        condition: "",
        maintenance: "",
        price: 0,
        description: "",
        advertisementType: "Rent",
        paymentMethod: "Monthly",
        houseType: "House",
        essentials: [],
        currency: "USD",
      });
      setSelectedFiles([]);
      setImagePreviews([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.advertisementType ||
      !formData.houseType ||
      !formData.currency
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);

    try {
      const apiFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "essentials" && Array.isArray(value)) {
            apiFormData.append(key, JSON.stringify(value));
          } else {
            apiFormData.append(key, String(value));
          }
        }
      });

      // Add admin metadata
      apiFormData.append("visiblity", "Public"); // Support both spellings for backward compatibility
      apiFormData.append("visibility", "Public");
      apiFormData.append("status", "Active");
      apiFormData.append("timestamp", new Date().toISOString());
      apiFormData.append("isAdmin", "true"); // Add flag to indicate admin is creating this

      // Add replaceImages flag if in edit mode
      if (isEditMode) {
        apiFormData.append("replaceImages", replaceImages.toString());

        // If in edit mode and images were explicitly removed, send the removed URLs
        if (removedImageUrls.length > 0) {
          apiFormData.append(
            "removedImageUrls",
            JSON.stringify(removedImageUrls)
          );
        }
      }

      // Same field name repeated — backend reads multipart key "files"
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          apiFormData.append("files", file);
        });
      }

      // Determine the endpoint based on whether we're editing or creating
      const endpoint =
        isEditMode && initialData?._id
          ? `/api/house/${initialData._id}`
          : "/api/house/create";

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        body: apiFormData,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? "update" : "create"} house`);
      }

      const result = await response.json();

      if (result.success) {
        showToast(
          `House ${isEditMode ? "updated" : "created"} successfully!`,
          "success"
        );

        // Clear session storage on successful submission
        if (!isEditMode) {
          try {
            sessionStorage.removeItem("manageHouse-formData");
            sessionStorage.removeItem("manageHouse-imagePreviews");
          } catch (error) {
            console.error("Error clearing session storage:", error);
          }
        }

        if (isEditMode) {
          router.push("/products/houses");
        } else {
          resetForm();
        }
      } else {
        throw new Error(
          result.error || `Failed to ${isEditMode ? "update" : "create"} house`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showToast(
        `Failed to ${isEditMode ? "update" : "create"} house: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit House" : "Add New House"}
        </h1>
      </div> */}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>House Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">House Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter house name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="houseType">House Type *</Label>
                    <Select
                      value={formData.houseType}
                      onValueChange={(value: string) =>
                        handleSelectChange("houseType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select house type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Apartment">Apartment</SelectItem>
                        <SelectItem value="Guest House">Guest House</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedroom">Bedrooms</Label>
                    <Input
                      id="bedroom"
                      name="bedroom"
                      type="number"
                      value={formData.bedroom || ""}
                      onChange={handleInputChange}
                      placeholder="Number of bedrooms"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathroom">Bathrooms</Label>
                    <Input
                      id="bathroom"
                      name="bathroom"
                      type="number"
                      value={formData.bathroom || ""}
                      onChange={handleInputChange}
                      placeholder="Number of bathrooms"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parkingSpace">Parking Spaces</Label>
                    <Input
                      id="parkingSpace"
                      name="parkingSpace"
                      type="number"
                      value={formData.parkingSpace || ""}
                      onChange={handleInputChange}
                      placeholder="Number of parking spaces"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size (sq ft)</Label>
                    <Input
                      id="size"
                      name="size"
                      type="number"
                      value={formData.size || ""}
                      onChange={handleInputChange}
                      placeholder="House size"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter house description"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Essentials</Label>
                  <div className="flex flex-wrap gap-2">
                    {essentials.map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={item}
                          checked={formData.essentials.includes(item)}
                          onCheckedChange={() => toggleEssential(item)}
                        />
                        <Label htmlFor={item} className="text-sm">
                          {item}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Input
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      placeholder="House condition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance">Maintenance</Label>
                    <Input
                      id="maintenance"
                      name="maintenance"
                      value={formData.maintenance}
                      onChange={handleInputChange}
                      placeholder="Maintenance details"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price || ""}
                      onChange={handleInputChange}
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: string) =>
                        handleSelectChange("currency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ETB">ETB</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advertisementType">Listing Type *</Label>
                    <Select
                      value={formData.advertisementType}
                      onValueChange={(value: "Rent" | "Sale") =>
                        handleSelectChange("advertisementType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rent">For Rent</SelectItem>
                        <SelectItem value="Sale">For Sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.advertisementType === "Rent" && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Period</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value: string) =>
                        handleSelectChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>{isEditMode ? "Update House" : "Create House"}</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Image Upload Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>House Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isEditMode && (
                  <div className="flex items-center mb-2">
                    <Checkbox
                      id="replaceImages"
                      checked={replaceImages}
                      onCheckedChange={() => setReplaceImages(!replaceImages)}
                    />
                    <Label
                      htmlFor="replaceImages"
                      className="ml-2 text-sm text-gray-600"
                    >
                      Replace existing images (unchecked will add to existing)
                    </Label>
                  </div>
                )}

                {/* Image Previews Grid */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32">
                          <Image
                            src={preview}
                            alt={`House preview ${index + 1}`}
                            fill
                            className="object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48">
                      <Home className="h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        {imagePreviews.length > 0
                          ? "Add more images"
                          : "No images selected"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Select multiple images at once
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="house-image"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      document.getElementById("house-image")?.click()
                    }
                    disabled={loading}
                  >
                    {imagePreviews.length > 0
                      ? "Add More Images"
                      : "Upload Images"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageHouse;
