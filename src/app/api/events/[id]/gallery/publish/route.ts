import { NextResponse } from "next/server";
import { getCurrentUser, hashValue } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { publishGallerySchema } from "@/lib/validations/schemas";
import { nanoid } from "nanoid";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strict RBAC boundary: Team Members MUST NOT be able to publish galleries
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Team members are not authorized to publish galleries" },
      { status: 403 }
    );
  }

  const { id: eventId } = params;

  try {
    const body = await request.json();
    const result = publishGallerySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { pin } = result.data;

    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        gallery: true,
        _count: {
          select: {
            photos: { where: { isSelected: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.adminId !== user.userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this event" }, { status: 403 });
    }

    if (event._count.photos === 0) {
      return NextResponse.json(
        { error: "Cannot publish gallery: Please select at least one photo first" },
        { status: 400 }
      );
    }

    const pinHash = await hashValue(pin);
    const slug = event.gallery?.slug || nanoid(8).toLowerCase();

    // Create or update gallery record
    const gallery = await prisma.gallery.upsert({
      where: { eventId },
      create: {
        eventId,
        slug,
        pinHash,
        isPublished: true,
        publishedAt: new Date(),
      },
      update: {
        pinHash,
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const galleryUrl = `${protocol}://${host}/gallery/${gallery.slug}`;

    return NextResponse.json({
      message: "Gallery published successfully",
      gallery: {
        id: gallery.id,
        slug: gallery.slug,
        url: galleryUrl,
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt,
        selectedPhotosCount: event._count.photos,
      },
    });
  } catch (error) {
    console.error("Publish gallery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
