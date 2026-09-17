import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyGalleryToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Check token from Authorization header or cookie
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    const cookieStore = cookies();
    token = cookieStore.get(`psp_gallery_${slug}`)?.value || null;
  }

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized: PIN verification required to view photos" },
      { status: 401 }
    );
  }

  const tokenPayload = await verifyGalleryToken(token);
  if (!tokenPayload || tokenPayload.gallerySlug !== slug) {
    return NextResponse.json(
      { error: "Invalid or expired gallery session. Please enter the PIN again." },
      { status: 401 }
    );
  }

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
          },
        },
      },
    });

    if (!gallery || !gallery.isPublished) {
      return NextResponse.json(
        { error: "Gallery not found or is not published" },
        { status: 404 }
      );
    }

    // STRICT SECURITY FILTER: Return ONLY isSelected: true photos
    // Unpublished / draft / unselected photos are never returned to the customer
    const photos = await prisma.photo.findMany({
      where: {
        eventId: gallery.eventId,
        isSelected: true,
      },
      select: {
        id: true,
        filename: true,
        storageLocation: true,
        fileSize: true,
        mimeType: true,
        width: true,
        height: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      event: gallery.event,
      publishedAt: gallery.publishedAt,
      totalPhotos: photos.length,
      photos,
    });
  } catch (error) {
    console.error("Fetch gallery photos error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
