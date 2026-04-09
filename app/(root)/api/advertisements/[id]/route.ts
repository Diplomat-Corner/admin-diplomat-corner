import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Advertisement from "@/lib/models/advertisement.model";
import { auth } from "@clerk/nextjs/server";

interface ApiResponse {
  success: boolean;
  error?: string;
  advertisement?: typeof Advertisement;
  analytics?: {
    clickCount: number;
    viewCount: number;
    clicksOverTime?: Array<{ date: string; count: number }>;
    viewsOverTime?: Array<{ date: string; count: number }>;
  };
}

// GET handler - fetch a specific advertisement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Check if analytics are requested
    const includeAnalytics =
      request.nextUrl.searchParams.get("analytics") === "true";

    const response: ApiResponse = {
      success: true,
      advertisement,
    };

    // Include analytics data if requested
    if (includeAnalytics) {
      // Group clicks and views by date for trend analysis
      const clicksOverTime = processTrackingData(advertisement.clicks);
      const viewsOverTime = processTrackingData(advertisement.views);

      response.analytics = {
        clickCount: advertisement.clickCount,
        viewCount: advertisement.viewCount,
        clicksOverTime,
        viewsOverTime,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT handler - update an advertisement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    await connectToDatabase();

    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Update the advertisement with the new data
    Object.assign(advertisement, {
      ...body,
      timestamp: new Date().toISOString(),
    });

    await advertisement.save();

    return NextResponse.json({
      success: true,
      advertisement,
    });
  } catch (error) {
    console.error("Error updating advertisement:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE handler - delete an advertisement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    await advertisement.deleteOne();

    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to process tracking data for analytics
function processTrackingData(trackingData: Array<{ timestamp: string }>) {
  // Group data by date
  const grouped = trackingData.reduce<
    Record<string, Array<{ timestamp: string }>>
  >((acc, item) => {
    const date = new Date(item.timestamp).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Transform to array format for easier frontend consumption
  return Object.entries(grouped).map(([date, items]) => ({
    date,
    count: (items as Array<{ timestamp: string }>).length,
    items,
  }));
}
