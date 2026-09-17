import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { StorageService } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = params;
  const { searchParams } = new URL(request.url);
  const onlyMine = searchParams.get("mine") === "true";

  try {
    // Check event assignment
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isAssigned = event.members.some((m) => m.userId === user.userId);
    const isAdmin = user.role === "ADMIN" && event.adminId === user.userId;

    if (!isAdmin && !isAssigned) {
      return NextResponse.json(
        { error: "Forbidden: Not assigned to this event" },
        { status: 403 }
      );
    }

    const whereClause: any = { eventId };
    if (onlyMine || (user.role === "TEAM_MEMBER" && searchParams.get("filter") === "mine")) {
      whereClause.uploadedBy = user.userId;
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Fetch photos error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = params;

  try {
    // Check permission to upload to this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { members: { select: { userId: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isAssigned = event.members.some((m) => m.userId === user.userId);
    const isAdmin = user.role === "ADMIN" && event.adminId === user.userId;

    if (!isAdmin && !isAssigned) {
      return NextResponse.json(
        { error: "Forbidden: You cannot upload photos to an unassigned event" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No photos provided for upload" },
        { status: 400 }
      );
    }

    const uploadedPhotos = [];
    const failedUploads = [];

    // Process multiple photo uploads
    for (const file of files) {
      try {
        if (!file.type.startsWith("image/")) {
          failedUploads.push({
            filename: file.name,
            reason: "Only image files (JPEG, PNG, WebP) are allowed",
          });
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloud Object Storage (NEVER to database)
        const uploadResult = await StorageService.uploadPhoto(buffer, file.name, eventId);

        // Save Photo metadata to database
        const photoRecord = await prisma.photo.create({
          data: {
            eventId,
            uploadedBy: user.userId,
            filename: file.name,
            storageLocation: uploadResult.storageLocation,
            storageKey: uploadResult.storageKey,
            fileSize: uploadResult.fileSize,
            mimeType: file.type,
            width: uploadResult.width,
            height: uploadResult.height,
            isSelected: false, // Default to unselected until Admin curates
          },
          include: {
            uploader: {
              select: { id: true, name: true },
            },
          },
        });

        uploadedPhotos.push(photoRecord);
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        failedUploads.push({
          filename: file.name,
          reason: err.message || "Cloud storage upload failed",
        });
      }
    }

    return NextResponse.json(
      {
        message: `Successfully uploaded ${uploadedPhotos.length} photo(s)`,
        uploadedCount: uploadedPhotos.length,
        photos: uploadedPhotos,
        failedUploads,
      },
      { status: uploadedPhotos.length > 0 ? 201 : 400 }
    );
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
