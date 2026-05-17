"use client";
import Image from "next/image";
import { Car, CheckCircle, Circle, Home, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";

import { ICar } from "@/lib/models/car.model";
import LoadingComponent from "./ui/loading-component";
import ErrorDialog from "./dialogs/error-dialog";
import ValidationDialog from "./dialogs/validation-dialog";
import SuccessDialog from "./dialogs/success-dialog";

interface ICarExtended extends ICar {
  servicePrice?: number;
  imageUrls?: string[];
}

interface CarFormData {
  name: string;
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
  price: number;
  description: string;
  advertisementType: "Rent" | "Sale";
  paymentMethod: string;
  currency: string;
  tags: string;
}

interface ManageCarProps {
  initialData?: ICarExtended;
  isEditMode?: boolean;
}

const ManageCar: React.FC<ManageCarProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const userId = user?.id || "guest";

  const [formData, setFormData] = useState<CarFormData>({
    name: initialData?.name || "",
    year: initialData?.year || 0,
    mileage: initialData?.mileage || 0,
    speed: initialData?.speed || 0,
    milesPerGallon: initialData?.milesPerGallon || 0,
    transmission: initialData?.transmission || "Automatic",
    fuel: initialData?.fuel || "Gasoline",
    bodyType: initialData?.bodyType || "Truck",
    condition: initialData?.condition || "",
    engine: initialData?.engine || "",
    maintenance: initialData?.maintenance || "",
    price: initialData?.price || 0,
    description: initialData?.description || "",
    advertisementType:
      (initialData?.advertisementType as "Rent" | "Sale") || "Sale",
    paymentMethod: initialData?.paymentMethod || "Daily",
    currency: initialData?.currency || "ETB",
    tags: initialData?.tags || "",
  });
  const [isSending, setIsSending] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [missingFields, setMissingFields] = useState<
    { name: string; label: string; valid: boolean }[]
  >([]);
  const [createdCarId, setCreatedCarId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.imageUrls ||
      (initialData?.imageUrl ? [initialData.imageUrl] : [])
  );
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [replaceImages, setReplaceImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved form data from session storage if available
  useEffect(() => {
    if (!isEditMode) {
      try {
        const savedData = sessionStorage.getItem("manageCar-formData");
        const savedPreviews = sessionStorage.getItem("manageCar-imagePreviews");

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
        sessionStorage.setItem("manageCar-formData", JSON.stringify(formData));
        sessionStorage.setItem(
          "manageCar-imagePreviews",
          JSON.stringify(imagePreviews)
        );
      } catch (error) {
        console.error("Error saving form data to session storage:", error);
      }
    }
  }, [formData, imagePreviews, isEditMode]);

  useEffect(() => {
    if (isLoaded) {
      setFormData((prev) => ({
        ...prev,
        userId: userId,
      }));
    }
  }, [userId, isLoaded]);

  useEffect(() => {
    // Reset removedImageUrls when replaceImages is toggled to true
    if (replaceImages) {
      setRemovedImageUrls([]);
    }
  }, [replaceImages]);

  useEffect(() => {
    // When the advertisement type changes, set default payment method
    if (formData.advertisementType === "Sale") {
      setFormData((prev) => ({ ...prev, paymentMethod: "Daily" })); // Default for sale
    } else if (
      formData.advertisementType === "Rent" &&
      formData.paymentMethod === "Daily"
    ) {
      // Only update if it's the default sale value
      setFormData((prev) => ({ ...prev, paymentMethod: "Monthly" })); // Monthly for rent
    }
  }, [formData.advertisementType, formData.paymentMethod]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" ||
        name === "mileage" ||
        name === "price" ||
        name === "servicePrice"
          ? Number(value)
          : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      console.log(`Selected ${files.length} files`);

      // Store the new files
      if (replaceImages) {
        console.log(`Replacing all images with ${files.length} new files`);
        setSelectedFiles(files);
      } else {
        console.log(
          `Adding ${files.length} new files to existing ${selectedFiles.length} files`
        );
        setSelectedFiles((prev) => [...prev, ...files]);
      }

      // Generate previews for all selected files
      const newPreviews: string[] = [];

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            if (replaceImages) {
              setImagePreviews(newPreviews);
            } else {
              setImagePreviews((prev) => [...prev, ...newPreviews]);
            }
            console.log(
              `Generated ${
                newPreviews.length
              } image previews, total previews: ${
                replaceImages
                  ? newPreviews.length
                  : imagePreviews.length + newPreviews.length
              }`
            );
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

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

  const handleOptionChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add handleKeyDown function to prevent form submission on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLElement) {
      // Prevent form submission when pressing Enter on input fields
      // unless it's a textarea or button
      const tagName = e.target.tagName.toLowerCase();
      if (tagName !== "textarea" && tagName !== "button") {
        e.preventDefault();
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { name: "name", label: "Car Name" },
      { name: "price", label: "Price" },
      { name: "description", label: "Description" },
    ];

    // Check if formData has any undefined values for required fields
    const invalidFields = requiredFields.map((field) => {
      const value = formData[field.name as keyof CarFormData];
      return {
        ...field,
        valid:
          value !== undefined &&
          value !== null &&
          (typeof value === "string" ? value.trim() !== "" : true) &&
          (typeof value === "number" ? !isNaN(value) && value > 0 : true),
      };
    });

    setMissingFields(invalidFields);
    return invalidFields.every((field) => field.valid);
  };

  const handleSend = async () => {
    setIsSending(true);

    if (!validateForm()) {
      setShowValidationDialog(true);
      setIsSending(false);
      return;
    }

    try {
      const apiFormData = new FormData();

      // Convert paymentMethod to numeric format expected by the server
      let paymentMethodValue = "1"; // Default to Daily (1)

      if (formData.paymentMethod === "Daily") paymentMethodValue = "1";
      if (formData.paymentMethod === "Weekly") paymentMethodValue = "2";
      if (formData.paymentMethod === "Monthly") paymentMethodValue = "3";
      if (formData.paymentMethod === "Annually") paymentMethodValue = "4";

      // Add all form data to API form data
      Object.entries(formData).forEach(([key, value]) => {
        // Safely handle null or undefined values
        if (value !== undefined && value !== null) {
          if (key === "paymentMethod") {
            apiFormData.append(key, paymentMethodValue);
          } else {
            apiFormData.append(key, String(value));
          }
        } else {
          apiFormData.append(key, "");
        }
      });

      // We're always in admin mode in the admin panel
      apiFormData.append("timestamp", new Date().toISOString());
      // Don't send paymentId, let API generate it
      apiFormData.append("visiblity", "Public");
      apiFormData.append("status", "Active");
      apiFormData.append("isAdmin", "true");

      // Ensure we have a proper user ID (even if it's just "admin-user")
      if (!apiFormData.get("userId") || apiFormData.get("userId") === "guest") {
        apiFormData.set("userId", "admin-user");
      }

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

      // Multiple parts with the same field name "files" — matches diplomat-api (form.File["files"])
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          apiFormData.append("files", file);
        });
      }

      const endpoint = isEditMode
        ? `/api/cars/${initialData?._id}`
        : "/api/cars/create";
      const method = isEditMode ? "PUT" : "POST";

      console.log(`Sending ${selectedFiles.length} files to ${endpoint}`);

      const response = await fetch(endpoint, {
        method,
        body: apiFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setCreatedCarId(result.carId || "");
        setShowSuccessDialog(true);

        if (!isEditMode) {
          // Clear session storage after successful submission
          try {
            sessionStorage.removeItem("manageCar-formData");
            sessionStorage.removeItem("manageCar-imagePreviews");
          } catch (error) {
            console.error("Error clearing session storage:", error);
          }

          setFormData({
            name: "",
            year: 0,
            mileage: 0,
            speed: 0,
            milesPerGallon: 0,
            transmission: "Automatic",
            fuel: "Diesel",
            bodyType: "Truck",
            condition: "",
            engine: "",
            maintenance: "",
            price: 0,
            description: "",
            advertisementType: "Sale",
            paymentMethod: "Daily",
            currency: "ETB",
            tags: "",
          });
          setSelectedFiles([]);
          setImagePreviews([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else {
        throw new Error(result.error || "Failed to save car");
      }
    } catch (error) {
      setErrorMessage("Failed to save car");
      setErrorDetails(error instanceof Error ? error.message : "Unknown error");
      setShowErrorDialog(true);
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoaded) {
    return <LoadingComponent />;
  }

  return (
    <section
      className="flex flex-col min-h-screen bg-gray-50"
      onKeyDown={handleKeyDown}
    >
      <MaxWidthWrapper>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {/* <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditMode ? "Edit Car" : "Create Cars"}
          </h1> */}

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            {/* Navigation Buttons */}
            {/* <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {isEditMode ? (
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-700 hover:text-green-600 mb-8 text-sm font-medium transition-colors duration-200"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back to Cars
                </button>
              ) : (
                <Link href="/manage-product/car">
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto">
                    <Car className="w-5 h-5" />
                    <span className="font-medium">Create Cars</span>
                  </button>
                </Link>
              )}
            </div> */}

            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="New Car Listing"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="2022"
                    />
                  </div>
                </div>

                {/* Car Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage *
                    </label>
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="50000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Speed
                    </label>
                    <input
                      type="number"
                      name="speed"
                      value={formData.speed || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="120"
                    />
                  </div>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Automatic", "Manual"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={(e) =>
                          handleOptionChange("transmission", option)
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                          formData.transmission === option
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                        }`}
                      >
                        {formData.transmission === option ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Diesel", "Petrol", "Electric", "Hybrid"].map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={(e) => handleOptionChange("fuel", option)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                            formData.fuel === option
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {formData.fuel === option ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{option}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Body Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Truck", "SUV", "Sedan", "Hatchback", "Minivan"].map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={(e) =>
                            handleOptionChange("bodyType", option)
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                            formData.bodyType === option
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {formData.bodyType === option ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{option}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Car description"
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* File Uploads */}
                <div className="space-y-4">
                  {/* Car Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Car Images
                    </label>

                    {isEditMode && (
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="replaceImages"
                          checked={replaceImages}
                          onChange={() => setReplaceImages(!replaceImages)}
                          className="mr-2"
                        />
                        <label
                          htmlFor="replaceImages"
                          className="text-sm text-gray-600"
                        >
                          Replace existing images (unchecked will add to
                          existing)
                        </label>
                      </div>
                    )}

                    {/* Image Previews Grid */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative h-24 group">
                            <Image
                              src={preview}
                              alt={`Car preview ${index + 1}`}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload Images</span>
                    </button>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <input
                      type="text"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Excellent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Engine
                    </label>
                    <input
                      type="text"
                      name="engine"
                      value={formData.engine}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="3.8L V6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maintenance
                    </label>
                    <input
                      type="text"
                      name="maintenance"
                      value={formData.maintenance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Frequent"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="1000"
                    required
                  />
                </div>

                {/* Advertisement Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advertisement Type
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={(e) =>
                        handleOptionChange("advertisementType", "Sale")
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors ${
                        formData.advertisementType === "Sale"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                      }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          formData.advertisementType === "Sale"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <span className="text-sm font-medium">For Sale</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleOptionChange("advertisementType", "Rent")
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors ${
                        formData.advertisementType === "Rent"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                      }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 ${
                          formData.advertisementType === "Rent"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <span className="text-sm font-medium">For Rent</span>
                    </button>
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <div className="flex gap-2">
                    {["ETB", "USD", "EUR", "GBP"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={(e) => handleOptionChange("currency", option)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                          formData.currency === option
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                        }`}
                      >
                        {formData.currency === option ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="#Ford #F150 #2022"
                  />
                </div>

                {/* Add payment period options that show only for Rent */}
                {formData.advertisementType === "Rent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Period
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "Daily", label: "Daily" },
                        { value: "Weekly", label: "Weekly" },
                        { value: "Monthly", label: "Monthly" },
                        { value: "Annually", label: "Annually" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={(e) =>
                            handleOptionChange("paymentMethod", option.value)
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors ${
                            formData.paymentMethod === option.value
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {formData.paymentMethod === option.value ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                    isSending
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isSending ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </div>
                  ) : isEditMode ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </div>
          </main>
        </div>
      </MaxWidthWrapper>

      {/* Dialogs */}
      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        onRetry={handleSend}
        title="Error Creating Car"
        errorMessage={errorMessage}
        errorDetails={errorDetails}
      />

      <ValidationDialog
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        missingFields={missingFields}
        onGoBack={() => setShowValidationDialog(false)}
      />

      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        productName={formData.name}
        productId={createdCarId}
        productType="car"
      />
    </section>
  );
};

export default ManageCar;
