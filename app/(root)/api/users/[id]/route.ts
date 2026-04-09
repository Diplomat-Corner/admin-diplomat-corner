import { connectToDatabase } from "@/lib/db-connect";
import User from "@/lib/models/user.model";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Get specific user by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;

    // Check if id is a valid MongoDB ObjectId or a clerkId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    // Build the query based on the type of ID provided
    const query = isObjectId ? { _id: id } : { clerkId: id };

    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Update specific user by ID
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const userData = await req.json();

    // Check if id is a valid MongoDB ObjectId or a clerkId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    // Build the query based on the type of ID provided
    const query = isObjectId ? { _id: id } : { clerkId: id };

    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update only provided fields
    if (userData.firstName) user.firstName = userData.firstName;
    if (userData.lastName) user.lastName = userData.lastName;
    if (userData.email) user.email = userData.email;
    if (userData.imageUrl) user.imageUrl = userData.imageUrl;
    if (userData.address) user.address = userData.address;
    if (userData.role && ["customer", "admin"].includes(userData.role)) {
      user.role = userData.role;
    }

    await user.save();

    return NextResponse.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Delete specific user by ID
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;

    // Check if id is a valid MongoDB ObjectId or a clerkId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    // Build the query based on the type of ID provided
    const query = isObjectId ? { _id: id } : { clerkId: id };

    const deletedUser = await User.findOneAndDelete(query);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User deleted successfully",
      user: {
        id: deletedUser._id,
        clerkId: deletedUser.clerkId,
        email: deletedUser.email,
        firstName: deletedUser.firstName,
        lastName: deletedUser.lastName,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
