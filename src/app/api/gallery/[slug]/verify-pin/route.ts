import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { compareValue, signGalleryToken } from "@/lib/auth/jwt";
import { verifyPinSchema } from "@/lib/validations/schemas";

// In-memory brute-force attempt tracker: IP/identifier -> { attempts: number, lockUntil: number }
const attemptsMap = new Map<string, { attempts: number; lockUntil: number }>();

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const ip = request.headers.get("x-forwarded-for") || "client-ip";
  const rateLimitKey = `${slug}:${ip}`;

  // Check rate-limit lock
  const attemptRecord = attemptsMap.get(rateLimitKey);
  const now = Date.now();
  if (attemptRecord && attemptRecord.lockUntil > now) {
    const remainingSeconds = Math.ceil((attemptRecord.lockUntil - now) / 1000);
    return NextResponse.json(
      { error: `Too many failed attempts. Please wait ${remainingSeconds} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = verifyPinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const { pin } = result.data;

    const gallery = await prisma.gallery.findUnique({
      where: { slug },
      include: {
        event: { select: { id: true, title: true } },
      },
    });

    if (!gallery || !gallery.isPublished) {
      return NextResponse.json(
        { error: "Gallery not found or is not published" },
        { status: 404 }
      );
    }

    const isValid = await compareValue(pin, gallery.pinHash);

    if (!isValid) {
      // Record failed attempt
      const currentAttempts = (attemptRecord?.attempts || 0) + 1;
      let lockUntil = 0;
      if (currentAttempts >= 5) {
        lockUntil = now + 5 * 60 * 1000; // 5 minute lockout after 5 failures
      }
      attemptsMap.set(rateLimitKey, { attempts: currentAttempts, lockUntil });

      return NextResponse.json(
        {
          error: "Incorrect PIN. Please check the access PIN and try again.",
          remainingAttempts: Math.max(0, 5 - currentAttempts),
        },
        { status: 401 }
      );
    }

    // Reset attempt record on success
    attemptsMap.delete(rateLimitKey);

    // Issue signed gallery access token (valid for 24 hours)
    const galleryToken = await signGalleryToken({
      gallerySlug: slug,
      eventId: gallery.eventId,
      verifiedAt: now,
    });

    const response = NextResponse.json({
      message: "PIN verified successfully",
      token: galleryToken,
      eventTitle: gallery.event.title,
    });

    // Also set a gallery access cookie for convenience
    response.cookies.set({
      name: `psp_gallery_${slug}`,
      value: galleryToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Verify PIN error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
