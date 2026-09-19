# PhotoStream Pro — Full Stack Photo Sharing Platform
> **TrizenAI Technologies — Full Stack Internship Challenge Deliverable**  
> Candidate Submission | September 2026

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)
![Tests](https://img.shields.io/badge/Tests-13%20Passed-brightgreen)

---

## 1. Project Overview

**PhotoStream Pro** is a full-stack, production-ready collaborative photo sharing platform built specifically for event photography crews and their clients. It solves the real-world workflow bottleneck in high-volume photography (e.g. weddings, corporate galas):
1. **Photographers (Team Members)** upload high-volume batch photos directly to Cloud Object Storage.
2. **Lead Admins** review the team's uploads, curate and select the finest shots, set a 6-digit access PIN, and publish a client gallery.
3. **Clients / Customers** unlock their private gallery with a simple shareable link and PIN — **zero account creation or signup required**.

---

## 2. Key Features & Role Matrix

| Feature / Action | Admin / Lead | Team Member | Customer |
| :--- | :---: | :---: | :---: |
| Account Registration & Login | ✅ | ✅ (Invited/Created by Admin) | ❌ (No Account Needed) |
| Create Events | ✅ | ❌ | ❌ |
| Assign Photographers | ✅ | ❌ | ❌ |
| Upload Batch Event Photos | ✅ | ✅ (Assigned Events Only) | ❌ |
| View Uploaded Photos | ✅ (All Photos) | ✅ (Their Uploaded Photos) | ❌ |
| Curate / Select Photos | ✅ | ❌ (Strict 403 Forbidden) | ❌ |
| Publish Gallery & Set PIN | ✅ | ❌ (Strict 403 Forbidden) | ❌ |
| Access Public Gallery Link | ✅ | ✅ | ✅ |
| Enter PIN & Unlock Album | N/A | N/A | ✅ (PIN Protected) |
| Full-Screen Lightbox & Download | ✅ | ✅ | ✅ (Unlocked Gallery) |

---

## 3. Demo Credentials & Operational State

The platform is pre-seeded with the operational state matching the specification document:

### 👑 Lead Admin
- **Email:** `admin@trizen.com`
- **Password:** `AdminPassword123!`
- **Capabilities:** Create events, assign team members, curate photos, publish galleries, set PINs.

### 📷 Team Member (Photographer)
- **Email:** `photographer@trizen.com`
- **Password:** `TeamPassword123!`
- **Capabilities:** Upload batch photos to assigned events (`Arjun & Priya Wedding`). Cannot publish galleries or manage other users' photos.

### 💖 Customer Gallery (Zero Account Required)
- **Gallery URL:** `/gallery/abc123`
- **Access PIN:** `482917`
- **Event:** `Arjun & Priya Wedding` (Pre-seeded with curated high-res photos and unselected draft shots)

---

## 4. System Architecture

```
                                  ┌────────────────────────┐
                                  │      Client Browser    │
                                  │ (Admin, Team, Customer)│
                                  └───────────┬────────────┘
                                              │
                                              ▼
                    ┌──────────────────────────────────────────────────┐
                    │               Next.js 14 App Router              │
                    ├─────────────────────────┬────────────────────────┤
                    │   Client & Server UI    │    REST API Handlers   │
                    │  - Admin Dashboard      │  - /api/auth/*         │
                    │  - Team Upload Portal   │  - /api/events/*       │
                    │  - Customer Lightbox    │  - /api/gallery/*      │
                    │  - Role Middleware      │  - /api/admin/team/*   │
                    └───────────┬─────────────┴───────────┬────────────┘
                                │                         │
                                ▼                         ▼
                   ┌────────────────────────┐ ┌─────────────────────────┐
                   │     SQlite    Database │ │   Cloud Object Storage  │
                   │      (via Prisma)      │ │   (Cloudinary / S3)     │
                   │  - Users & Passwords   │ │  - High-res event photos│
                   │  - Events & Members    │ │  - Auto CDN thumbnails  │
                   │  - Photo Metadata      │ │  - Secure signed uploads│
                   │  - Galleries & PIN Hash│ │                         │
                   └────────────────────────┘ └─────────────────────────┘
```

### Architecture Highlights
- **Binary / Database Separation:** Compliant with Section 4. Binary images are **never stored in the database**. They are stored in Cloud Object Storage (Cloudinary/S3-compatible) with fast CDN delivery. The database contains only lightweight metadata (`id`, `event_id`, `uploaded_by`, `filename`, `storage_location`, `file_size`, `created_at`).
- **Security & RBAC:** Session management uses signed JWT tokens inside secure HTTP-only cookies (`psp_token`). API endpoints strictly enforce role permissions; Team Members attempting to publish galleries receive a `403 Forbidden`.
- **PIN Protection:** Gallery access PINs (e.g. `482917`) are hashed using `bcryptjs` with salt rounds. Plaintext PINs are never stored in the database. Customer access is verified via signed session tokens with built-in brute force lockout protection (5 failed attempts trigger rate-limit lockout).

---

## 5. Database Schema & Entities

```
┌──────────────────┐       1:N       ┌──────────────────┐
│      User        ├────────────────►│      Event       │
│  (ADMIN / TEAM)  │ (created_by)    │ (Title, Date..)  │
└────────┬─────────┘                 └────────┬─────────┘
         │                                    │
         │ 1:N                                │ 1:N
         ▼                                    ▼
┌──────────────────┐       N:1       ┌──────────────────┐
│   EventMember    │◄────────────────┤      Photo       │
│   (Assignment)   │                 │ (Metadata, URL)  │
└──────────────────┘                 └────────┬─────────┘
                                              │
                                     1:1      ▼
                             ┌──────────────────┐
                             │     Gallery      │
                             │ (Slug, PIN Hash) │
                             └──────────────────┘
```

- **User:** `id`, `name`, `email`, `passwordHash`, `role` (`ADMIN` | `TEAM_MEMBER`), `createdAt`
- **Event:** `id`, `title`, `description`, `date`, `location`, `adminId` (FK User), `createdAt`
- **EventMember:** `id`, `eventId` (FK Event), `userId` (FK User), `assignedAt` (Unique: `[eventId, userId]`)
- **Photo:** `id`, `eventId` (FK Event), `uploadedBy` (FK User), `filename`, `storageLocation`, `storageKey`, `fileSize`, `mimeType`, `isSelected`, `createdAt`
- **Gallery:** `id`, `eventId` (FK Event, Unique), `slug` (Unique shareable token), `pinHash` (bcrypt), `isPublished`, `publishedAt`, `createdAt`

---

## 6. REST API Reference

### Authentication
- `POST /api/auth/register` — Public registration for Lead Admin accounts
- `POST /api/auth/login` — Sign in for Admin and Team Members (returns HTTP-only cookie)
- `POST /api/auth/logout` — Invalidate session
- `GET /api/auth/me` — Return current authenticated user profile & role

### Team Management (Admin Only)
- `GET /api/admin/team` — List all registered team members
- `POST /api/admin/team` — Create login credentials for a new photographer

### Events
- `POST /api/events` — Create new event (**Admin Only**)
- `GET /api/events` — List events (**Admin:** all; **Team Member:** assigned events only)
- `GET /api/events/:id` — Get event details (enforces event assignment isolation; returns 403 if unauthorized)
- `POST /api/events/:id/members` — Assign team members to event (**Admin Only**)

### Photos & Cloud Uploads
- `POST /api/events/:id/photos` — Batch upload photos to cloud object storage and save metadata to DB
- `GET /api/events/:id/photos` — List photos for event (`?mine=true` filters by uploader)
- `PATCH /api/events/:id/photos/selection` — Admin toggles photo selection for gallery. **Returns 403 for Team Members.**

### Gallery Publishing & Client Access
- `POST /api/events/:id/gallery/publish` — Admin publishes gallery, hashes PIN, generates slug. **Returns 403 for Team Members.**
- `GET /api/gallery/:slug/info` — **Public (Customer)**: Public title, description & PIN requirement check (no photo URLs returned).
- `POST /api/gallery/:slug/verify-pin` — **Public (Customer)**: Verify PIN against bcrypt hash; issues 24-hour signed session token.
- `GET /api/gallery/:slug/photos` — **Verified Customer**: Returns **strictly curated published photos** (`isSelected: true`).

---

## 7. Local Setup Instructions

### Prerequisites
- Node.js 18+ (tested on Node v20 LTS)
- npm or pnpm

### Step 1: Clone Repository & Install Dependencies
```bash
git clone <repository-url>
cd photo-sharing-platform
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="photo-sharing-platform-jwt-secret-key-production-32chars"
GALLERY_TOKEN_SECRET="gallery-access-secret-token-key-production-32chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cloud Object Storage (Optional for local testing; fallback local storage is enabled)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### Step 3: Initialize Database & Seed Demo Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Automated Testing

Run the comprehensive test suite verifying authentication, role boundaries, gallery publishing, customer PIN verification, and event isolation:
```bash
npm test
```

### Test Coverage Summary:
- `tests/auth.test.ts` — Passwords hashed with bcrypt, JWT token creation, Admin vs Team Member role validation.
- `tests/gallery.test.ts` — Gallery publishing PIN constraints, curation payload validation, RBAC 403 rejection for Team Members.
- `tests/pin.test.ts` — 6-digit PIN hashing & verification, customer session token creation, rejection of invalid tokens.
- `tests/isolation.test.ts` — Cross-event isolation, filtering of unselected draft photos from customer view.

---

## 9. Production Cloud Deployment

### Deploy to Vercel + Managed PostgreSQL (Supabase / Neon)
1. **Database:** Create a free PostgreSQL database on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. **Schema:** In `prisma/schema.prisma`, update the datasource provider to `postgresql` (or use `prisma/schema.postgresql.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. **Storage:** Create a free account at [Cloudinary](https://cloudinary.com) and copy your `CLOUD_NAME`, `API_KEY`, and `API_SECRET`.
4. **Deploy:** Connect your Git repository to [Vercel](https://vercel.com), set the environment variables (`DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`), and deploy with 1 click.
5. Run migrations and seed in production:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

---

## 10. Known Limitations & Future Enhancements

- **Watermarking:** Watermarks can be dynamically added via Cloudinary transformations before final high-res purchase.
- **Expiration Dates:** Optional gallery self-destruct / expiry dates can be toggled by the Admin.
- **ZIP Download:** Bulk download of all curated photos as a single compressed ZIP file.
#
