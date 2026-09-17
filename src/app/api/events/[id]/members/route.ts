import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { assignMembersSchema } from "@/lib/validations/schemas";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const { id: eventId } = params;

  try {
    const body = await request.json();
    const result = assignMembersSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userIds } = result.data;

    // Verify event exists and is owned by this admin
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { adminId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.adminId !== user.userId) {
      return NextResponse.json({ error: "Forbidden: Not your event" }, { status: 403 });
    }

    // Insert assignments (ignoring duplicates)
    for (const userId of userIds) {
      await prisma.eventMember.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        create: {
          eventId,
          userId,
        },
        update: {},
      });
    }

    // Return updated member list
    const updatedMembers = await prisma.eventMember.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({
      message: "Team members assigned successfully",
      members: updatedMembers,
    });
  } catch (error) {
    console.error("Assign members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
