import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db-connect";
import Review from "@/lib/models/review.model";
import { auth } from "@clerk/nextjs/server";
import Notification from "@/lib/models/notification.model";
import User from "@/lib/models/user.model";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    await connectToDatabase();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if the user is the owner of the review
    if (review.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own reviews" },
        { status: 403 }
      );
    }

    // Create notification for target user (seller)
    if (review.targetUserId) {
      try {
        await Notification.create({
          userId: review.targetUserId,
          title: "Review Deleted",
          message: `A review for your product has been deleted.`,
          type: "alert",
          category: "system",
          link: `/product/${review.productId}`,
        });
      } catch (notificationError) {
        console.error("Error creating seller notification:", notificationError);
      }
    }

    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    await connectToDatabase();

    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is an admin
    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Find the review and populate the user field
    const review = await Review.findById(reviewId).populate(
      "user",
      "firstName lastName"
    );

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}
