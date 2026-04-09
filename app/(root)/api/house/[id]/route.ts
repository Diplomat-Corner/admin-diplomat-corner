import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db-connect";
import House from "@/lib/models/house.model";
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
  houseId?: string;
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    await connectToDatabase();
    const house = await House.findById(id);

    if (!house) {
      return NextResponse.json(
        { success: false, error: "House not found", paymentId: "" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ...house.toObject() });
  } catch (error) {
    console.error("Error fetching house:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch house", paymentId: "" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    await connectToDatabase();
    const existingHouse = await House.findById(id);

    if (!existingHouse) {
      return NextResponse.json(
        { success: false, error: "House not found", paymentId: "" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    // Check if this is an admin request
    const isAdmin = formData.get("isAdmin") === "true";

    // Get userId - either from auth or form data for admin
    let userId = (formData.get("userId") as string) || "admin-user";

    if (!isAdmin) {
      try {
        const authUserId = (await auth()).userId;
        if (!authUserId) {
          return NextResponse.json(
            { success: false, error: "Unauthorized", paymentId: "" },
            { status: 401 }
          );
        }
        userId = authUserId;
      } catch (error) {
        console.log("Auth error:", error);
        return NextResponse.json(
          { success: false, error: "Authentication failed", paymentId: "" },
          { status: 401 }
        );
      }
    }

    // Handle multiple files
    const files: File[] = [];
    const singleFile = formData.get("file") as File;

    // First check for multiple files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("files") && value instanceof File) {
        files.push(value);
      }
    }

    // If no multiple files found but a single file exists, use that
    if (files.length === 0 && singleFile && singleFile instanceof File) {
      files.push(singleFile);
    }

    const receiptFile = formData.get("receipt") as File;

    const houseData = {
      name: formData.get("name") as string,
      bedroom: Number(formData.get("bedroom")),
      size: Number(formData.get("size")),
      bathroom: Number(formData.get("bathroom")),
      parkingSpace: Number(formData.get("parkingSpace")),
      condition: formData.get("condition") as string,
      maintenance: formData.get("maintenance") as string,
      price: Number(formData.get("price")),
      description: formData.get("description") as string,
      advertisementType: formData.get("advertisementType") as "Rent" | "Sale",
      paymentMethod: formData.get("paymentMethod") as
        | "Monthly"
        | "Quarterly"
        | "Annual",
      houseType: formData.get("houseType") as
        | "House"
        | "Apartment"
        | "Guest House",
      essentials: JSON.parse(formData.get("essentials") as string),
      currency: formData.get("currency") as string,
    };

    // Validate required fields
    if (
      !houseData.name ||
      !houseData.description ||
      !houseData.price ||
      !houseData.advertisementType ||
      !houseData.houseType ||
      !houseData.currency
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields", paymentId: "" },
        { status: 400 }
      );
    }

    // Handle image uploads
    let imageUrls = existingHouse.imageUrls || [];
    let imageUrl = existingHouse.imageUrl;

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

    // Upload new receipt if provided
    let receiptUrl = existingHouse.paymentReceipt?.url;
    if (receiptFile) {
      const uploadResult = await uploadImage(receiptFile, "receipts");
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error, paymentId: "" },
          { status: 500 }
        );
      }
      receiptUrl = uploadResult.publicUrl;
    }

    // Update house
    const updatedHouse = await House.findByIdAndUpdate(
      id,
      {
        ...houseData,
        imageUrls: imageUrls, // Explicitly assign the array
        imageUrl, // Keep for backward compatibility
        paymentReceipt: receiptUrl
          ? {
              url: receiptUrl,
              paymentId: existingHouse.paymentId,
              uploadedAt: new Date(),
            }
          : existingHouse.paymentReceipt,
      },
      { new: true }
    );

    console.log(
      `House updated with ID: ${updatedHouse._id}, imageUrls: ${JSON.stringify(
        imageUrls
      )}, imageUrl: ${imageUrl}, number of images: ${imageUrls.length}`
    );

    return NextResponse.json({
      success: true,
      message: "House updated successfully",
      houseId: updatedHouse._id.toString(),
      paymentId: existingHouse.paymentId,
    });
  } catch (error) {
    console.error("House update error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update house: " +
          (error instanceof Error ? error.message : String(error)),
        paymentId: "",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    await connectToDatabase();

    // First, find the house to get its paymentId
    const house = await House.findById(id);

    if (!house) {
      return NextResponse.json(
        { success: false, error: "House not found" },
        { status: 404 }
      );
    }

    // Get payment ID from the house
    const paymentId = house.paymentId;

    // Delete all associated data in parallel
    const deletePromises = [];

    // 1. Delete associated payment (if it exists)
    if (paymentId && !paymentId.startsWith("admin-created-")) {
      try {
        const Payment = (await import("@/lib/models/payment.model")).default;
        deletePromises.push(
          Payment.deleteMany({
            $or: [{ productId: id }, { paymentId: paymentId }],
          })
        );
      } catch (error) {
        console.warn("Error importing Payment model:", error);
      }
    } else {
      console.log(
        "Skipping payment deletion: Admin-created house without valid payment ID"
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

    // 4. Add the house deletion to the promises
    deletePromises.push(House.findByIdAndDelete(id));

    // Execute all deletion operations
    await Promise.all(deletePromises);

    return NextResponse.json({
      success: true,
      message: "House and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting house:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete house: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const { status } = await req.json();

    if (!status || !["Active", "Pending"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const house = await House.findByIdAndUpdate(id, { status }, { new: true });

    if (!house) {
      return NextResponse.json(
        { success: false, error: "House not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ...house.toObject() });
  } catch (error) {
    console.error("Error updating house status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update house status" },
      { status: 500 }
    );
  }
}
