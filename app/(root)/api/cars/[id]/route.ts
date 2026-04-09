import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Car from "@/lib/models/car.model";
import Payment from "@/lib/models/payment.model";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";

const CPANEL_API_URL = process.env.NEXT_PUBLIC_CPANEL_API_URL;
const CPANEL_USERNAME = process.env.NEXT_PUBLIC_CPANEL_USERNAME;
const CPANEL_API_TOKEN = process.env.NEXT_PUBLIC_CPANEL_API_TOKEN;
const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_PUBLIC_DOMAIN;

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  carId?: string;
  paymentId?: string;
}

async function uploadImage(
  file: File,
  folder: "public_images" | "receipts"
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  const extension = file.name.split(".").pop();
  const randomFileName = `${uuidv4()}.${extension}`;

  const uploadFolder =
    folder === "receipts" ? "public_images/receipts" : folder;

  const apiFormData = new FormData();
  apiFormData.append("dir", `/public_html/${uploadFolder}/`);
  apiFormData.append("file-1", file, randomFileName);

  if (!CPANEL_API_TOKEN) {
    return { success: false, error: "CPanel API token is not configured" };
  }

  const authHeader = `cpanel ${CPANEL_USERNAME}:${CPANEL_API_TOKEN.trim()}`;

  try {
    const response = await fetch(
      `${CPANEL_API_URL}/execute/Fileman/upload_files`,
      {
        method: "POST",
        headers: { Authorization: authHeader },
        body: apiFormData,
      }
    );

    const data = await response.json();

    if (data.status === 0) {
      return {
        success: false,
        error: data.errors?.join(", ") || "Upload failed",
      };
    }

    const uploadedFile = data.data?.uploads[0];
    if (!uploadedFile || !uploadedFile.file) {
      return { success: false, error: "No uploaded file details returned" };
    }

    const publicUrl = `${PUBLIC_DOMAIN}/${uploadFolder}/${uploadedFile.file}`;
    return { success: true, publicUrl };
  } catch (error) {
    console.error("Image upload error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

// Function to handle multiple image uploads
async function uploadMultipleImages(
  files: File[],
  folder: "public_images" | "receipts"
): Promise<{ success: boolean; publicUrls: string[]; error?: string }> {
  try {
    console.log(
      `Starting upload of ${files.length} files to folder: ${folder}`
    );

    // Process each file one by one
    const publicUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      console.log(
        `Uploading file ${i + 1}/${files.length}: ${files[i].name} (${
          files[i].size
        } bytes)`
      );
      const result = await uploadImage(files[i], folder);

      if (!result.success) {
        console.error(`Failed to upload file ${i + 1}: ${result.error}`);
        return {
          success: false,
          publicUrls,
          error: `Failed to upload file ${i + 1}/${files.length}: ${
            result.error
          }`,
        };
      }

      console.log(`Successfully uploaded file ${i + 1} to ${result.publicUrl}`);
      publicUrls.push(result.publicUrl as string);
    }

    console.log(`All ${files.length} files uploaded successfully`);
    return {
      success: true,
      publicUrls,
    };
  } catch (error) {
    console.error("Multiple image upload error:", error);
    return {
      success: false,
      publicUrls: [],
      error:
        "Failed to upload multiple images: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// PUT handler
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const isAdmin = formData.get("isAdmin") === "true";

    // Get userId from auth, or use "admin-user" for admin requests
    let userId: string;
    if (isAdmin) {
      // Admin bypass - use default admin-user ID
      userId = "admin-user";
    } else {
      // Regular user - require authentication
      const authUserId = (await auth()).userId;
      if (!authUserId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized", paymentId: "" },
          { status: 401 }
        );
      }
      userId = authUserId;
    }

    // Handle multiple files
    const files: File[] = [];
    const singleFile = formData.get("file") as File;

    // First check for multiple files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("files") && value instanceof File) {
        console.log(`[PUT] Found file with key: ${key}`);
        files.push(value);
      }
    }

    // If no multiple files found but a single file exists, use that
    if (files.length === 0 && singleFile && singleFile instanceof File) {
      console.log("[PUT] No files[] entries found, using single file instead");
      files.push(singleFile);
    }

    console.log(`[PUT] Total files to process: ${files.length}`);

    const receiptFile = formData.get("receipt") as File;

    const carData = {
      name: formData.get("name") as string,
      year: Number(formData.get("year")),
      mileage: Number(formData.get("mileage")),
      speed: Number(formData.get("speed")),
      milesPerGallon: Number(formData.get("milesPerGallon")),
      transmission: formData.get("transmission") as string,
      fuel: formData.get("fuel") as string,
      bodyType: formData.get("bodyType") as string,
      condition: formData.get("condition") as string,
      engine: formData.get("engine") as string,
      maintenance: formData.get("maintenance") as string,
      price: Number(formData.get("price")),
      description: formData.get("description") as string,
      advertisementType: formData.get("advertisementType") as "Rent" | "Sale",
      paymentMethod: (() => {
        // Convert numeric value to string enum value
        const methodValue = formData.get("paymentMethod") as string;

        // Handle numeric values for backward compatibility
        if (methodValue === "1") return "Daily";
        if (methodValue === "2") return "Weekly";
        if (methodValue === "3") return "Monthly";
        if (methodValue === "4") return "Annually";

        // If it's already a string value, use it directly
        if (["Daily", "Weekly", "Monthly", "Annually"].includes(methodValue)) {
          return methodValue;
        }

        // Default to Daily
        return "Daily";
      })(),
      currency: formData.get("currency") as string,
      tags: formData.get("tags") as string,
      updatedAt: new Date(),
    };

    // Validate required fields
    if (!carData.name || !carData.price || !carData.mileage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields", paymentId: "" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find existing car
    const existingCar = await Car.findById(id);
    if (!existingCar) {
      return NextResponse.json(
        { success: false, error: "Car not found", paymentId: "" },
        { status: 404 }
      );
    }

    // Check ownership - admins can edit any car, regular users only their own
    if (!isAdmin && existingCar.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
      );
    }

    // Handle image uploads
    let imageUrls = existingCar.imageUrls || [];
    let imageUrl = existingCar.imageUrl;

    // Check if we should replace existing images or add to them
    const shouldReplaceImages = formData.get("replaceImages") === "true";

    // Process any specifically removed image URLs (if not replacing all)
    if (!shouldReplaceImages) {
      const removedImageUrlsJson = formData.get("removedImageUrls") as string;
      if (removedImageUrlsJson) {
        try {
          const removedImageUrls = JSON.parse(removedImageUrlsJson) as string[];
          if (Array.isArray(removedImageUrls) && removedImageUrls.length > 0) {
            console.log(
              `Removing ${removedImageUrls.length} specific images:`,
              removedImageUrls
            );

            // Filter out the removed image URLs
            imageUrls = imageUrls.filter(
              (url: string) => !removedImageUrls.includes(url)
            );
          }
        } catch (error) {
          console.error("Error parsing removedImageUrls:", error);
        }
      }
    }

    if (files.length > 0) {
      const uploadResults = await uploadMultipleImages(files, "public_images");
      if (!uploadResults.success) {
        return NextResponse.json(
          { success: false, error: uploadResults.error, paymentId: "" },
          { status: 500 }
        );
      }

      if (shouldReplaceImages) {
        // Replace all existing images
        imageUrls = uploadResults.publicUrls;
      } else {
        // Add new images to existing ones
        imageUrls = [...imageUrls, ...uploadResults.publicUrls];
      }

      // Update the primary image for backward compatibility
      imageUrl = imageUrls.length > 0 ? imageUrls[0] : undefined;
    }

    // Upload receipt if provided
    let receiptUrl = "";
    if (receiptFile) {
      const uploadResult = await uploadImage(receiptFile, "receipts");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error, paymentId: "" },
          { status: 500 }
        );
      }
      receiptUrl = uploadResult.publicUrl || "";
    }

    // Update car
    const updatedCar = await Car.findByIdAndUpdate(
      id,
      {
        ...carData,
        imageUrls: imageUrls,
        imageUrl,
      },
      { new: true }
    );

    console.log(
      `Car updated with ID: ${updatedCar._id}, imageUrls: ${JSON.stringify(
        imageUrls
      )}, imageUrl: ${imageUrl}, number of images: ${imageUrls.length}`
    );

    // Update payment record if receipt was uploaded
    if (receiptUrl) {
      await Payment.findOneAndUpdate(
        { carId: id },
        {
          receiptUrl,
          servicePrice: Number(formData.get("servicePrice")),
          updatedAt: new Date(),
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Car updated successfully",
      carId: updatedCar._id.toString(),
      paymentId: existingCar.paymentId,
    });
  } catch (error) {
    console.error("Car update error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update car: " +
          (error instanceof Error ? error.message : String(error)),
        paymentId: "",
      },
      { status: 500 }
    );
  }
}

// PATCH handler for status updates
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // For admin routes, make authentication optional
    let userId = "admin-user";
    try {
      const authUser = await auth();
      if (authUser.userId) {
        userId = authUser.userId;
      }
    } catch (error) {
      console.log("Auth error, using default admin userId:", error);
    }

    const data = await request.json();
    const { status } = data;

    // Validate status value
    if (status !== "Active" && status !== "Pending") {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find and update car status
    const updatedCar = await Car.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedCar) {
      return NextResponse.json(
        { success: false, error: "Car not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Car status updated successfully",
      car: updatedCar,
    });
  } catch (error) {
    console.error("Car status update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update car status" },
      { status: 500 }
    );
  }
}

// DELETE handler
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // Check if this is an admin request by looking for the isAdmin parameter
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get("isAdmin") === "true";

    // For admin routes, make authentication optional
    let userId = isAdmin ? "admin-user" : null;

    if (!isAdmin) {
      try {
        const authUser = await auth();
        if (authUser.userId) {
          userId = authUser.userId;
        }
      } catch (error) {
        console.log("Auth error:", error);
        return NextResponse.json(
          { success: false, error: "Authentication failed", paymentId: "" },
          { status: 401 }
        );
      }

      // If not admin and no userId, return unauthorized
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized", paymentId: "" },
          { status: 401 }
        );
      }
    }

    await connectToDatabase();

    const car = await Car.findById(id);
    if (!car) {
      return NextResponse.json(
        { success: false, error: "Car not found", paymentId: "" },
        { status: 404 }
      );
    }

    // Admin can delete any car, but regular users can only delete their own
    if (userId !== "admin-user" && car.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", paymentId: "" },
        { status: 401 }
      );
    }

    // Get payment ID from the car
    const paymentId = car.paymentId;

    // Delete all associated data in parallel
    const deletePromises = [];

    // 1. Delete associated payment (if it exists)
    if (paymentId && !paymentId.startsWith("admin-created-")) {
      try {
        deletePromises.push(
          Payment.deleteMany({
            $or: [{ productId: id }, { paymentId: paymentId }],
          })
        );
      } catch (error) {
        console.warn("Error deleting payments:", error);
      }
    } else {
      console.log(
        "Skipping payment deletion: Admin-created car without valid payment ID"
      );
    }

    // 2. Delete associated reviews (if they exist)
    try {
      const Review = (await import("@/lib/models/review.model")).default;
      deletePromises.push(Review.deleteMany({ productId: id }));
    } catch (error) {
      console.warn("Error importing Review model:", error);
    }

    // 3. Delete associated notifications (if they exist)
    try {
      const Notification = (await import("@/lib/models/notification.model"))
        .default;
      deletePromises.push(
        Notification.deleteMany({
          $or: [{ targetId: id }, { entityId: id }],
        })
      );
    } catch (error) {
      console.warn("Error importing Notification model:", error);
    }

    // 4. Add the car deletion to the promises
    deletePromises.push(Car.findByIdAndDelete(id));

    // Execute all deletion operations
    await Promise.all(deletePromises);

    return NextResponse.json({
      success: true,
      message: "Car and all associated data deleted successfully",
      carId: id,
      paymentId: car.paymentId,
    });
  } catch (error) {
    console.error("Car deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete car: " +
          (error instanceof Error ? error.message : String(error)),
        paymentId: "",
      },
      { status: 500 }
    );
  }
}

// GET handler
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await connectToDatabase();

    const car = await Car.findById(id);
    if (!car) {
      return NextResponse.json(
        { success: false, error: "Car not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      car: car.toObject(),
    });
  } catch (error) {
    console.error("Error fetching car:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch car" },
      { status: 500 }
    );
  }
}
