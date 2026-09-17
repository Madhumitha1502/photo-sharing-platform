import { NextResponse } from "next/server";
import { getCurrentUser, hashValue } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { createTeamMemberSchema } from "@/lib/validations/schemas";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  const teamMembers = await prisma.user.findMany({
    where: { role: "TEAM_MEMBER" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          eventAssignments: true,
          photosUploaded: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ teamMembers });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = createTeamMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashValue(password);

    const teamMember = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "TEAM_MEMBER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Team member created successfully",
      teamMember,
    }, { status: 201 });
  } catch (error) {
    console.error("Create team member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
