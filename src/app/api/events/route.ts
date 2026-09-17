import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { createEventSchema } from "@/lib/validations/schemas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let events;

    if (user.role === "ADMIN") {
      // Admins see all events they created
      events = await prisma.event.findMany({
        where: { adminId: user.userId },
        include: {
          admin: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          gallery: {
            select: { id: true, slug: true, isPublished: true, publishedAt: true },
          },
          _count: {
            select: {
              photos: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Team Members see ONLY assigned events (strict isolation)
      events = await prisma.event.findMany({
        where: {
          members: {
            some: { userId: user.userId },
          },
        },
        include: {
          admin: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          gallery: {
            select: { id: true, slug: true, isPublished: true },
          },
          _count: {
            select: {
              photos: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Attach selected photos count for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const selectedPhotosCount = await prisma.photo.count({
          where: { eventId: event.id, isSelected: true },
        });
        return {
          ...event,
          selectedPhotosCount,
        };
      })
    );

    return NextResponse.json({ events: eventsWithStats });
  } catch (error) {
    console.error("Fetch events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden. Only Admins can create events." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = createEventSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, date, location } = result.data;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : null,
        location,
        adminId: user.userId,
      },
    });

    return NextResponse.json(
      { message: "Event created successfully", event },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
