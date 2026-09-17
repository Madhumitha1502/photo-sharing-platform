import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { updatePhotoSelectionSchema } from "@/lib/validations/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strict RBAC boundary: Only Admins can curate photos for galleries
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Team members are not authorized to select photos for sharing" },
      { status: 403 }
    );
  }

  const { id: eventId } = params;

  try {
    const body = await request.json();
    const result = updatePhotoSelectionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { photoIds, isSelected } = result.data;

    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { adminId: true },
    });

    if (!event || event.adminId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this event" },
        { status: 403 }
      );
    }

    // Update photo selection in batch
    await prisma.photo.updateMany({
      where: {
        id: { in: photoIds },
        eventId,
      },
      data: {
        isSelected,
      },
    });

    const totalSelected = await prisma.photo.count({
      where: { eventId, isSelected: true },
    });

    return NextResponse.json({
      message: `Updated selection for ${photoIds.length} photo(s)`,
      totalSelected,
      isSelected,
    });
  } catch (error) {
    console.error("Photo selection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
