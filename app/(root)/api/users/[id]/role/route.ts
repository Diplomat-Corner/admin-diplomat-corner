import { connectToDatabase } from "@/lib/db-connect";
import User from "@/lib/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database first
    await connectToDatabase();

    // Check admin status directly from database
    // Instead of using checkAdminAccess utility which would create circular references
    const requestingUser = await User.findOne({ clerkId: userId });

    if (!requestingUser || requestingUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role } = body;

    if (!role || !["admin", "customer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'customer'" },
        { status: 400 }
      );
    }

    const { id } = await params;

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user role
    user.role = role;
    await user.save();

    // Set cache-control headers to enforce revalidation
    const response = NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

    // Ensure browsers and CDNs don't cache this response
    response.headers.set("Cache-Control", "no-store, must-revalidate");

    return response;
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      {
        error: "Failed to update user role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
