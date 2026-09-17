import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Photo Sharing Platform database...");

  // 1. Clean existing records
  await prisma.gallery.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.eventMember.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // 2. Passwords & PIN hashing
  const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 10);
  const teamPasswordHash = await bcrypt.hash("TeamPassword123!", 10);
  const galleryPinHash = await bcrypt.hash("482917", 10);

  // 3. Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: "admin@trizen.com",
      passwordHash: adminPasswordHash,
      name: "Lead Admin (Karthik)",
      role: "ADMIN",
    },
  });

  // 4. Create Team Member User
  const teamMember = await prisma.user.create({
    data: {
      email: "photographer@trizen.com",
      passwordHash: teamPasswordHash,
      name: "Alex Photographer",
      role: "TEAM_MEMBER",
    },
  });

  // 5. Create Demo Event (as per PDF: "Arjun & Priya Wedding")
  const event = await prisma.event.create({
    data: {
      title: "Arjun & Priya Wedding",
      description: "Official ceremony, rituals and grand wedding reception celebration",
      date: new Date("2026-09-15T10:00:00Z"),
      location: "The Grand Palace, Bangalore",
      adminId: admin.id,
      members: {
        create: [
          {
            userId: teamMember.id,
          },
        ],
      },
    },
  });

  // 6. Create realistic sample photos (Unsplash high quality wedding photography)
  const samplePhotos = [
    {
      filename: "wedding_ceremony_ring_exchange.jpg",
      storageLocation: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      fileSize: 2450000,
      isSelected: true,
    },
    {
      filename: "bride_portrait_golden_hour.jpg",
      storageLocation: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      fileSize: 3120000,
      isSelected: true,
    },
    {
      filename: "reception_stage_floral_decor.jpg",
      storageLocation: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
      fileSize: 2890000,
      isSelected: true,
    },
    {
      filename: "couple_first_dance.jpg",
      storageLocation: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
      fileSize: 1980000,
      isSelected: true,
    },
    {
      filename: "wedding_cake_cutting.jpg",
      storageLocation: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
      fileSize: 1750000,
      isSelected: true,
    },
    {
      filename: "family_toast_celebration.jpg",
      storageLocation: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
      fileSize: 2200000,
      isSelected: true,
    },
    // Photos uploaded by team but NOT selected for the published gallery (demonstrating Admin curation & customer privacy)
    {
      filename: "candid_setup_raw_shot_01.jpg",
      storageLocation: "https://images.unsplash.com/photo-1509927083803-4bd519298ac4?auto=format&fit=crop&w=1200&q=80",
      fileSize: 4500000,
      isSelected: false, // unselected draft
    },
    {
      filename: "lighting_test_frame_02.jpg",
      storageLocation: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
      fileSize: 3800000,
      isSelected: false, // unselected draft
    },
  ];

  for (const p of samplePhotos) {
    await prisma.photo.create({
      data: {
        eventId: event.id,
        uploadedBy: teamMember.id,
        filename: p.filename,
        storageLocation: p.storageLocation,
        fileSize: p.fileSize,
        mimeType: "image/jpeg",
        isSelected: p.isSelected,
      },
    });
  }

  // 7. Create Demo Gallery (Slug: abc123, PIN: 482917)
  await prisma.gallery.create({
    data: {
      eventId: event.id,
      slug: "abc123",
      pinHash: galleryPinHash,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  console.log("Database seeded successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Admin Credentials:        admin@trizen.com / AdminPassword123!");
  console.log("Demo Team Member Credentials:  photographer@trizen.com / TeamPassword123!");
  console.log("Demo Gallery URL:              /gallery/abc123");
  console.log("Demo Gallery PIN:              482917");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
