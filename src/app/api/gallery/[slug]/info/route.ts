import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const gallery = await prisma.gallery.findUnique({
      where: { slug },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            location: true,
            _count: {
              select: {
                photos: { where: { isSelected: true } },
              },
            },
          },
        },
      },
    });

    if (!gallery || !gallery.isPublished) {
      return NextResponse.json(
        { error: "Gallery not found or is not yet published" },
        { status: 404 }
      );
    }

    // Return public preview info only. Do NOT expose photos yet.
    return NextResponse.json({
      title: gallery.event.title,
      description: gallery.event.description,
      date: gallery.event.date,
      location: gallery.event.location,
      publishedAt: gallery.publishedAt,
      photoCount: gallery.event._count.photos,
      requiresPin: true,
    });
  } catch (error) {
    console.error("Gallery info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
