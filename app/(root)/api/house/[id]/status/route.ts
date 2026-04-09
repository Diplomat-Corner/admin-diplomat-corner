import { NextRequest, NextResponse } from "next/server";
import House from "@/lib/models/house.model";
import { connectToDatabase } from "@/lib/db-connect";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    
    if (!status || !["Pending", "Active"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'Pending' or 'Active'" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    const house = await House.findById(id);
    
    if (!house) {
      return NextResponse.json(
        { error: "House not found" },
        { status: 404 }
      );
    }
    
    house.status = status;
    await house.save();
    
    return NextResponse.json({ success: true, house });
  } catch (error) {
    console.error("Error updating house status:", error);
    return NextResponse.json(
      { error: `Failed to update house status: ${(error as Error).message || "Unknown server error"}` },
      { status: 500 }
    );
  }
} 