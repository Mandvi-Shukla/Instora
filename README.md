# Instora

**A full-stack digital operations platform for offline coaching institutes** — replacing physical registers, attendance notebooks, fee receipts, and WhatsApp-based communication with a single, role-based web application. Extended with a paid online batch marketplace for recorded video courses.

Currently deployed and publicly branded as **JSS — Jai Shree Shyam Coaching Institute**. *"Instora"* is the underlying platform/product name; *"JSS"* is the institute using it (shown to end users via a "Powered by Instora" footer credit).


## 🔗 Links

- 🌐 **Live Application:** https://jsscoaching.vercel.app
- ⚙️ **Backend API:** https://jsscoaching-production.up.railway.app
- 📂 **Source Code:** https://github.com/jssinstitute659-blip/JSSCOACHING

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture Highlights](#architecture-highlights)
- [Data Models](#data-models)
- [API Structure](#api-structure)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment Notes](#deployment-notes)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Overview

Instora began as a role-based institute management system serving three user types — admin, teacher, and student — and has since grown into a two-sided platform. It now combines:

1. **Offline institute operations** — attendance, fees, tests, doubt resolution, and communication for a physical coaching center
2. **A paid online batch marketplace** — a fourth, public-facing user type ("paid user") can browse, purchase, and stream recorded video course batches independent of the offline institute

Built as a flagship portfolio project by a final-year B.Tech (Mathematics & Computing) student, with an emphasis on production-realistic architecture: role-based auth, verified payments, real-time communication, secure media delivery, and scheduled automation.

## Key Features

### Institute Management (Admin / Teacher / Student)

| Area | Details |
|---|---|
| **Authentication** | JWT-based, role-scoped (admin/teacher/student), live DB validation on every protected request, rate-limited login (10 attempts / 15 min) |
| **Student & Teacher Management** | Full CRUD, teacher-to-batch assignment, cascading deletes for dependent records |
| **Attendance** | Session-based tracking with a dedicated `BatchSession` model, Present/Absent/Holiday states, 24-hour teacher edit window, batch and student-level calendar views |
| **Fee Management** | Automated monthly fee generation (`node-cron`, daily), Razorpay online payments with HMAC signature verification, full payment ledger, auto-generated receipts |
| **AI Exam Platform** | Groq API (`llama-3.3-70b-versatile`) for MCQ generation, server-synced exam timers, auto-submission on timeout, leaderboards, per-student result analytics |
| **Doubt / Chat System** | Real-time student-teacher messaging, image and voice-note support via Cloudinary, session save/resolve states, automatic 48-hour cleanup of abandoned sessions |
| **Real-Time Notifications** | Socket.io with JWT-authenticated handshakes and role-/batch-scoped rooms for announcements and alerts |

### Paid Batch Marketplace

| Area | Details |
|---|---|
| **Public Storefront** | Landing page listings and detailed batch pages with syllabus, curriculum preview, and FAQs |
| **Purchase Pipeline** | Razorpay checkout → HMAC-verified payment → automatic buyer account creation → credentials delivered via email (Nodemailer/Gmail) |
| **Secure Content Delivery** | Lecture videos and notes stored in a private Cloudflare R2 bucket; all access brokered through short-lived presigned URLs — no public exposure |
| **Learner Dashboard** | Per-batch progress tracking (90% watch-threshold completion), resumable playback, downloadable notes, aggregate progress summary |
| **Admin Content Pipeline** | Direct browser-to-R2 uploads with live progress bars, tabbed batch editor (Overview / Curriculum / Lectures / FAQs / Notes), buyer-aware deletion safeguards |

## Tech Stack

**Backend**
- Node.js, Express.js
- MongoDB with Mongoose
- JWT (`jsonwebtoken`) authentication + `bcryptjs` password hashing
- `socket.io` for real-time communication (JWT-authenticated handshake, role-based rooms)
- `helmet`, custom NoSQL-injection guard, `express-rate-limit`
- Razorpay for payments (HMAC SHA-256 verification)
- Cloudinary (chat media) and Cloudflare R2 via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (thumbnails, lecture videos, notes)
- Groq SDK for AI-powered MCQ generation
- Nodemailer (Gmail SMTP + App Password) for transactional email
- `node-cron` for scheduled jobs

**Frontend**
- React 18 (Vite)
- React Router DOM v6
- Tailwind CSS v4 (`@tailwindcss/vite` plugin, no config file)
- Axios — separate authenticated (`API`) and public (`PUBLIC_API`) instances
- `socket.io-client`
- Razorpay Checkout.js via a custom `useRazorpay` hook

**Deployment**
- Backend: Railway
- Frontend: Vercel

## Architecture Highlights

- **Consistent feature pipeline** — every feature follows Model → Controller → Route → Service file → Page, keeping the codebase predictable and easy to extend without touching existing files
- **Unified multi-role authentication** — a single login endpoint and a single `/login` UI transparently support four roles. `authController.login()` checks the primary `User` collection first (admin/teacher/student) and falls back to the `PaidUser` collection by email, so the original three roles are unaffected by the newer role
- **Role-branching middleware** — `protect()` reads `decoded.role` from the JWT to decide whether to query `User` or `PaidUser`, and manually attaches a `.role` field to `PaidUser` documents (which have no native role field) so the existing `authorize(...roles)` guard works identically across all four roles
- **Financial integrity** — fee status is always recalculated from the `Payment` ledger rather than trusted from the client; both Razorpay flows (student fees and batch purchases) use HMAC signature verification and idempotency guards
- **Secure media delivery, not public hosting** — lecture videos and notes live in a private R2 bucket with zero public access; every read/write goes through a short-lived, access-verified presigned URL (10-min admin upload, 2-hr learner watch, 30-min note download)
- **Decoupled marketing vs. real content** — `PaidBatch.curriculumPreview` (a flat marketing list of titles/durations) is intentionally separate from the real `Lecture` model with actual `videoKey`s, avoiding schema coupling between public marketing copy and the paywalled delivery pipeline
- **Route registration order** — Express matches middleware by registration order, not specificity, so more specific route prefixes (e.g. `/api/paid-batches/purchase`) are always registered before broader ones (`/api/paid-batches`) that carry an unconditional `protect` middleware

## Data Models

**Core (offline institute):** `User`, `Student`, `Batch`, `Attendance`, `BatchSession`, `Fee`, `Payment`, `RazorpayOrder`, `Inquiry`, `Test`, `Question`, `TestSubmission`, `TestAnswer`, `DoubtSession`, `DoubtMessage`, `Announcement`, `Notification`

**Paid Batch Marketplace:** `PaidBatch`, `PaidUser`, `PaidBatchOrder`, `Lecture`, `PaidNote`, `LectureProgress`

Notable design choices:
- `Lecture.order` is a flat integer with no chapter/module grouping — a deliberate simplification that can be extended later without migrating existing data
- `LectureProgress` uses a unique `(paidUserId, lectureId)` index; a lecture is marked complete once `watchedSeconds / durationSeconds ≥ 0.9`
- `PaidBatch.stats.totalLectures` auto-syncs on lecture create/delete; `totalDurationHours` is currently manually entered by the admin

## API Structure

| Route Prefix | Access | Purpose |
|---|---|---|
| `/api/auth` | Public | Login (all four roles) |
| `/api/admin`, `/api/students`, `/api/teachers`, `/api/batches` | Admin | Institute CRUD operations |
| `/api/attendance`, `/api/fees`, `/api/payments`, `/api/razorpay` | Admin/Teacher/Student | Attendance and student fee payments |
| `/api/tests`, `/api/ai` | Teacher/Student | Test creation, AI MCQ generation, exam-taking |
| `/api/doubts`, `/api/announcements` | Teacher/Student | Real-time chat and announcements |
| `/api/public` | Public | Inquiries and public institute info |
| `/api/paid-batches/public`, `/api/paid-batches/purchase` | Public | Batch browsing and purchase (registered **before** `/api/paid-batches`) |
| `/api/paid-batches` | Admin | Paid batch CRUD, publish toggle, deletion (buyer-count gated) |
| `/api/paid-users` | Paid User | Self-service profile and password management |
| `/api/admin/content` | Admin | Lecture/notes upload, presigned URL issuance, deletion |
| `/api/learn` | Paid User | Lecture list, signed watch URLs, progress updates, notes, progress summary |

All responses follow a consistent shape: `{ success: Boolean, message: String, data: Any }`.

## Project Structure

```
instora/
├── backend/
│   ├── server.js              # Entry point — dotenv, HTTP server, Socket.io, DB connect, cron jobs
│   ├── seed.js
│   └── src/
│       ├── app.js             # Express app, route registration (order-sensitive)
│       ├── config/            # DB, Cloudinary, Cloudflare R2, Nodemailer setup
│       ├── models/            # Mongoose schemas
│       ├── controllers/       # Route handlers / business logic
│       ├── routes/            # Express route definitions
│       ├── middlewares/       # Auth (role-branching), error handling
│       ├── socket/            # Socket.io setup and room assignment
│       └── jobs/              # Scheduled cron jobs (fee generation, doubt cleanup)
└── frontend/
    └── src/
        ├── components/        # Reusable UI components
        ├── context/           # Auth & Socket context providers
        ├── hooks/             # Custom hooks (Razorpay checkout)
        ├── layouts/            # Role-based layout shells (Admin/Teacher/Student/PaidUser)
        ├── pages/              # Route-level pages, grouped by role
        ├── routes/             # Route configuration and protected-route guards
        └── services/           # Axios API modules (authenticated + public instances)
```

## Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB instance (local or Atlas)
- API keys/accounts for: Razorpay, Cloudinary, Cloudflare R2, Groq, and a Gmail account with an App Password

### Installation

```bash
git clone https://github.com/<your-username>/instora.git
cd instora

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Running Locally

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.

## Environment Variables

**`backend/.env`**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

GROQ_API_KEY=your_groq_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Cloudflare R2
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key      # must be scoped to ALL buckets in use
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=your_public_bucket_name         # public — thumbnails only
R2_PUBLIC_URL=your_r2_public_url
R2_PRIVATE_BUCKET=your_private_bucket_name  # private — lecture videos + notes, CORS required

# Email
EMAIL_USER=your_gmail_address
EMAIL_APP_PASSWORD=your_16_char_gmail_app_password
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

> **Note:** Vite bakes `VITE_` variables into the JS bundle at build time. Any change requires a fresh deployment, not just a dashboard save. Backend variables must be added directly in Railway's Variables tab — local `.env` files are not read by Railway.

## Deployment Notes

- **Backend (Railway):** root directory `backend/`. `CLIENT_URL` must point to the stable Vercel production domain — never a preview-deployment URL with a random hash, since those are not stable across deploys.
- **Frontend (Vercel):** root directory `frontend/`, with a `vercel.json` SPA rewrite rule. `VITE_API_URL` must include the `https://` scheme explicitly.
- **Cloudflare R2:** two buckets — one public (thumbnails, public dev URL enabled) and one private (lecture videos + notes, no public access). A CORS policy (allowed origins + PUT/GET methods) is required on the private bucket for direct browser-to-R2 presigned uploads to work; Postman does not enforce CORS, so backend-only testing can pass while the browser UI still fails.
- **Gmail SMTP:** requires 2-Step Verification enabled on the account, plus a generated 16-character App Password (not the account password) in `EMAIL_APP_PASSWORD`.

## Roadmap

- Admin UI to view purchase history per batch
- Auto-computation of total batch duration from uploaded lecture metadata
- Drag-and-drop lecture reordering
- Optional chapter/module grouping for lecture content
- CORS policy review for the public thumbnail bucket if direct browser uploads are introduced there

## Author

**Deepak** — Final-year B.Tech student, Mathematics & Computing, Delhi Technological University (DTU)
