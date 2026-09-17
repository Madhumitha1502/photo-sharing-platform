import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = params;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        gallery: true,
        _count: {
          select: {
            photos: true,
            members: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Role-based Access Check:
    // If not Admin and not an assigned member, deny access with 403
    const isAssignedMember = event.members.some((m) => m.userId === user.userId);
    const isAdminOwner = user.role === "ADMIN" && event.adminId === user.userId;

    if (!isAdminOwner && !isAssignedMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this event" },
        { status: 403 }
      );
    }

    const selectedPhotosCount = await prisma.photo.count({
      where: { eventId: event.id, isSelected: true },
    });

    return NextResponse.json({
      event: {
        ...event,
        selectedPhotosCount,
      },
      userRole: user.role,
    });
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
