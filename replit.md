# Scuola di Longboard Platform

## Overview

Scuola di Longboard is an authentication-only course player integrated with WordPress/WooCommerce. WordPress handles all public pages, marketing, and sales, while Replit provides the private dashboard and course content player exclusively for enrolled students. Enrollment is managed via WooCommerce webhooks and manual admin additions. The platform is a TypeScript monorepo using React, Express, and PostgreSQL, designed with a surf-culture aesthetic. The project aims to provide a secure and engaging learning environment for students.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Platform Purpose & Architecture

**Replit = Authentication-Only Platform**: Serves only authenticated users with a dashboard and course player, with no public marketing pages. Its purpose is secure course content delivery to enrolled students.

**WordPress = Public-Facing Platform**: Handles all public pages, including marketing, course listings, and sales via WooCommerce. It sends enrollment data to Replit.

**Integration Points**: WooCommerce webhook (for automatic enrollment) and manual admin enrollment.

### Frontend Architecture

The frontend uses React 18, TypeScript, and Vite. **No public-facing landing page** - unauthenticated users see only the login screen. Authenticated users land on a **Welcome Page** (`/`) with full-screen background images (desktop/mobile), a 3-step fade animation ("Benvenuto, Nome" → white logo → "Good Vibes" image), and a "Vai alle lezioni" button that navigates to `/dashboard`. The welcome page has no navbar or footer. Wouter manages client-side routing for `/dashboard`, `/corsi/:id/player` (course player), `/p/:slug` (custom pages), and `/admin/*` pages. State management uses TanStack Query. UI components are built with Radix UI primitives and styled with Tailwind CSS, following a shadcn/ui pattern. The design uses HSL values, CSS custom properties for theming, and Montserrat/Inter fonts.

**Navbar Features**:
- Logo and Home link redirect to WordPress (https://scuoladilongboard.it)
- "Guida App" link with HelpCircle icon for app guide section
- "I Miei Corsi" dropdown shows enrolled courses for quick access
- Profile section with avatar and link to Dashboard
- Logout redirects to /login

### Backend Architecture

The backend is an Express.js server with TypeScript, providing RESTful API endpoints. A storage abstraction layer (`server/storage.ts`) handles database operations. Express middleware is used for JSON parsing, logging, error handling, and session management.

### Data Storage

PostgreSQL, hosted on Neon, is the primary database, accessed via `@neondatabase/serverless` and Drizzle ORM. The schema includes tables for `users`, `courses`, `modules`, `lessons`, `exercises`, `enrollments`, `lessonProgress`, `exerciseProgress`, `certificates`, `posts`, `comments`, `badges`, `heroSlides`, `pageHeaders`, `customPages`, `pageBlocks`, `newsletterContacts`, `newsletterCampaigns`, `newsletterEvents`, `referralCodes`, `referralEarnings`, and `sessions`. Drizzle Kit manages schema migrations. A production database seeding system populates content from development.

### Authentication & Authorization

**WordPress SSO Integration**: The platform uses WordPress as the single source of truth for user authentication. Two login methods are supported:

1. **SSO Redirect** (`/sso?token=XXX`): WordPress generates a JWT token and redirects users to Replit. The JWT contains user ID, email, name, and avatar.

2. **Direct Login** (`/api/login`): Users can log in directly from the app using WordPress credentials. The app verifies credentials against WordPress REST API.

**WooCommerce Integration**: When a customer completes a purchase (status: 'completed' or 'processing'), WooCommerce sends a webhook to `/webhooks/woocommerce`. The webhook creates the user (if new) and enrolls them in the purchased courses based on product-to-course mappings stored in `courseProducts` table. Raw body is captured via express.json verify callback for HMAC signature verification. Product ID mappings: REMATA=1216, TAKEOFF=1231, NOSERIDE=1243. Auto-migration in `server/seed.ts` creates missing tables (`course_products`, `woocommerce_webhook_logs`, etc.) and seeds product mappings on production startup.

**Deployment**: User deploys via git push to Railway (NOT Replit publishing). Railway connects to Neon production database. The Replit "production" database is separate from Railway's.

**Admin Webhook Tools**: GET `/api/admin/webhook-status` shows config and mappings. POST `/api/admin/webhook-test` simulates webhook lookup. POST `/api/admin/force-seed` triggers production database seeding at runtime (creates courses, modules, lessons, exercises if missing). GET `/api/admin/webhook-diagnostic` runs full pipeline test. POST `/api/admin/webhook-simulate` runs full enrollment flow without signature verification (for admin testing). GET `/api/admin/webhook-logs` returns webhook logs with debug traces. Admin panel has a "Webhook" page at `/admin/webhook` for diagnostics, simulation, and log viewing.

**Production Seeding**: `server/seed.ts` seeds courses, modules, lessons, exercises, and course_products on production startup. Data comes from `scripts/production-seed-data.json` (exported via `scripts/export-data.ts`). If seed file is missing, hardcoded fallback creates the 3 courses with correct UUIDs. Seeding checks each content type independently and uses `onConflictDoNothing()` for safe re-runs. Multiple file paths are tried for Railway compatibility.

**User IDs**: All users are prefixed with `wp_` followed by their WordPress user ID (e.g., `wp_123`). This ensures consistency between WordPress and Replit.

Session management uses Express sessions stored in PostgreSQL with secure HTTP-only cookies. Authorization is handled via `userLevel` and `isAdmin` fields. Admin users have full access. Security includes `httpOnly` and `secure` cookie flags and JWT verification with shared secret.

### UI/UX Decisions

The design reflects a surf-culture aesthetic with a turquoise and ocean-blue palette. Customizable hero sliders and page headers support images, titles, subtitles, and optional logos. An advanced page builder CMS allows for creating custom pages with text, image, banner, layout container, and gallery blocks. Typography uses Montserrat for headers and Inter for body text.

### Technical Implementations

The project is a full-stack TypeScript monorepo. It uses `zod` for schema validation and `date-fns` for date handling. Server-side image uploads are managed directly to Google Cloud Storage (GCS). A system exports development data to a `production-seed-data.json` file for seeding the production database.

**Profile Management**: User profile is read-only (displays name, email from WordPress). Only the avatar can be changed from the app. A link directs users to WordPress for profile edits.

**Admin Dashboard**: Simplified to core functions:
- Corsi (Course management)
- Gestione Studenti (Student management and progress tracking)
- Pagine Custom (Custom page builder)
- Header Pagine (Page header images)
- Guida App (App guide page management - titles, descriptions, video URLs, HTML content, ordering, publish toggle)

**Guida App Feature**: Standalone section at `/guida-app` for authenticated users. Managed via `/admin/guida-app`. Uses `guide_pages` table with title (MiniRichTextEditor), description (MiniRichTextEditor), videoUrl, videoUrls (array), htmlContent (RichTextEditor), orderIndex, and published flag. Course-player-style layout with sidebar navigation and content area.

**Removed Features**: Newsletter, Events, Clinic, Community pages have been removed. These are handled by WordPress.

## External Dependencies

*   **Authentication**: Replit Auth (OpenID Connect)
*   **Database**: Neon Serverless PostgreSQL
*   **Date Handling**: `date-fns`
*   **Form Validation**: Zod
*   **UI Components**: Radix UI primitives
*   **Build Tools**: Vite, esbuild, Drizzle Kit
*   **Replit Specific**: `@replit/vite-plugin-*`