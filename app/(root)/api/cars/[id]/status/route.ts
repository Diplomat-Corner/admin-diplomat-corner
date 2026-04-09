import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Car from "@/lib/models/car.model";
import { auth } from "@clerk/nextjs/server";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  car?: typeof Car;
}

// PATCH handler for status updates
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
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

    // Ensure we have valid JSON in the request
    let data;
    try {
      data = await request.json();
    } catch (error) {
      console.error("Invalid JSON in request:", error);
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request" },
        { status: 400 }
      );
    }

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
