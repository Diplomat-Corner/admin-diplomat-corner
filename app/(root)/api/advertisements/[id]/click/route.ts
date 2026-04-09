import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Advertisement from "@/lib/models/advertisement.model";
import { auth } from "@clerk/nextjs/server";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  clickCount?: number;
}

// POST handler - record a click for an advertisement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    // Get user ID from auth
    let userId = "anonymous";
    try {
      const authUser = await auth();
      if (authUser.userId) {
        userId = authUser.userId;
      }
    } catch (error) {
      console.log("Auth error, using anonymous userId:", error);
    }

    // Get device info from request
    const userAgent = request.headers.get("user-agent") || "unknown";
    // Get IP address - only use request.headers
    const ipAddress =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown";

    await connectToDatabase();

    // Find the advertisement
    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Record the click
    advertisement.clicks.push({
      userId,
      timestamp: new Date(),
      device: userAgent,
      ipAddress,
    });

    // Update the click count
    advertisement.clickCount = advertisement.clicks.length;

    // Save the updated advertisement
    await advertisement.save();

    return NextResponse.json({
      success: true,
      message: "Click recorded successfully",
      clickCount: advertisement.clickCount,
    });
  } catch (error) {
    console.error("Error recording advertisement click:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record click" },
      { status: 500 }
    );
  }
}
