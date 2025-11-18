# Scuola di Longboard Platform

## Overview

Scuola di Longboard is a full-stack surf school learning platform serving as an **authentication-only course player** integrated with WordPress/WooCommerce. **WordPress handles ALL public pages, marketing, and sales via WooCommerce**; Replit provides the **private dashboard and course content player exclusively for enrolled students**. Enrollment is tracked via WooCommerce webhooks (automatic) and manual admin additions only. The platform is a TypeScript monorepo using React, Express, and PostgreSQL (via Neon), with Replit authentication. The design is inspired by surf culture with a turquoise and ocean-blue palette.

### Recent Changes (Nov 2025)

**Complete Architectural Refactoring - Authentication-Only Platform** ✅:
- **Core Architecture**: Replit is now strictly authentication-only; WordPress handles ALL public-facing content, marketing, course listings, and sales
- **Removed All Public Routes**: Deleted `/corsi`, `/corsi/:id`, `/clinic`, `/clinic/:id` - all replaced by WordPress pages
- **Deprecated Pages Removed**: CourseInfo.tsx, Clinic.tsx, ClinicDetail.tsx, Courses.tsx (public listing) completely removed
- **Homepage Simplification**: 
  - Non-authenticated users: Hero Slider + Footer only
  - Authenticated users: Auto-redirect to `/dashboard`
- **Navigation Streamlined**: 
  - Header: Home, Community (optional), Dashboard (authenticated only), account controls
  - Footer: Minimal links only
  - Removed all "Corsi" and "Clinic" navigation links
- **Admin Panel Simplified**: Removed Hero Slider, Newsletter, Eventi, Clinic management; kept only:
  - Dashboard Admin
  - Dashboard Utente (testing)
  - Iscrizioni (enrollments)
  - Intestazioni Pagine
  - Pagine Custom
  - Gestione Corsi (content management only)

**Complete Clinic Functionality Removal** ✅:
- **Database Migration**: Dropped `clinics` and `clinic_registrations` tables completely using `npm run db:push --force`
- **Schema Cleanup**: Removed all Clinic/ClinicRegistration types, relations, and insert schemas from `shared/schema.ts`
- **Storage Layer**: Removed all clinic-related methods from IStorage interface and DBStorage implementation
- **API Routes**: Removed all `/api/clinics/*` endpoints and clinic-related routes
- **Frontend Cleanup**: Deleted Clinic.tsx, ClinicDetail.tsx, AdminClinics.tsx files
- **Dashboard Updates**: Removed clinic registrations query and display section
- **Seed Data**: Removed clinic references from production seed system

**Enrollment Architecture** ✅:
- **WooCommerce Webhook** (pending implementation): Automatic enrollment via `POST /api/webhooks/woocommerce`
- **Manual Admin Enrollment** (existing): Admins can instantly enroll users via admin panel
- **Dashboard Display**: Shows only courses user is enrolled in (purchased via WooCommerce or admin-enrolled)
- **CoursePlayer Access**: Restricted to enrolled users only; redirects unauthorized users

### Recent Changes (Oct 2025)

**User Dashboard Enhancements**:
- Added profile editing section: users can update firstName, lastName, email, and profile image using MediaUploadZone
- Integrated WavePoints display card showing referral earnings balance with encouraging messages
- **Removed legacy level system completely**: All references to beginner/intermediate/advanced filters removed from Footer, Community page, AdminCourses UI, and throughout the platform for a cleaner, simplified experience

**Admin Features - Enrollments & Testing**:
- Created comprehensive enrollments management page at `/admin/iscrizioni` with:
  - User table showing all enrollments with course details and progress percentages
  - Search functionality by name/email
  - Course filter to view enrollments for specific courses
  - Statistics dashboard showing total users, active enrollments, and average progress
- Added admin menu links: "Dashboard Utente" (to view user experience) and "Iscrizioni" (enrollments management)
- **Admin auto-enrollment**: Admins can now instantly enroll in any course via "Iscriviti al Corso" button in AdminCourses without payment, enabling easy testing and content access

**Admin Features - Course Content Management**:
- **Complete CRUD for Modules**: Full create/update/delete operations for course modules with `title`, `description`, `orderIndex`, and `defaultExpanded` fields
- **Complete CRUD for Lessons**: Full create/update/delete operations for lessons with support for multiple video URLs, PDF uploads, HTML content, and `contentType` categorization
- **Auto-Module Creation System**: When selecting a course with no modules, clicking "Aggiungi Contenuto" on any content type section automatically creates a default "Contenuti Corso" module, eliminating manual module creation step
- **Content Management UI** at `/admin/corsi/contenuti`:
  - Two-section layout: "Gestione Moduli" for manual module management + "Contenuti per Tipo" for content organization
  - Content organized by type (Presentazione, E-Book, Planning, Esercizio, Riscaldamento, Settimane 1-4) matching student view
  - Accordion-based interface with content counters for each type
  - Auto-detection of custom/legacy content types not in predefined list
  - Dialog-based forms with react-hook-form Select synchronization fix using setTimeout pattern
  - MediaUploadZone integration for video and PDF uploads
  - Real-time updates via TanStack Query cache invalidation
  - Triple-guard system preventing module duplication: modulesLoading check, mutation.isPending check, and modules.length verification
  - "Espandi di default" checkbox to control module expansion behavior in student view
- **Quick Access Link**: "Gestisci Contenuti" button added to each course card in AdminCourses page

**Student Course Interface Enhancements**:
- **Module Accordion Navigation**: Modules displayed as collapsible accordion sections (using Shadcn Accordion) organizing related lessons
- **Default Expansion Control**: Modules with `defaultExpanded=true` open automatically on course load using controlled accordion pattern
- **Auto Lesson Selection**: First lesson in first available module auto-selected on course entry to prevent blank screen
- **Lesson Progress Tracking**: 
  - CheckCircle2 icons displayed next to completed lessons in sidebar
  - "Completata" badge shown in lesson header when marked complete
  - Toggle button below each lesson to mark/unmark completion
  - Real-time progress updates via TanStack Query mutations
- **Controlled Accordion State**: Uses `value/onValueChange` pattern with useEffect initialization to ensure async-loaded `defaultExpanded` flags are honored
- **Visual Hierarchy**: Folder icons for modules, content-type specific icons for lessons (Video, FileText, Calendar, Dumbbell, Flame icons)

**Backend API Enhancements**:
- `PUT /api/profile`: Profile update endpoint with Zod validation and email uniqueness checking
- `GET /api/wavepoints`: Retrieves user's WavePoints balance from referral earnings
- `GET /api/admin/enrollments`: Admin-only endpoint returning all users with their enrollments and progress data
- `POST /api/admin/enroll/:courseId`: Admin-only instant enrollment without payment
- **Module CRUD APIs**: `POST /api/admin/modules` (accepts courseId in body for auto-creation), `POST /api/admin/courses/:courseId/modules` (courseId in path), `PATCH/DELETE /api/admin/modules/:id`, `GET /api/courses/:courseId/modules`
- **Lesson CRUD APIs**: `POST/PATCH/DELETE /api/admin/lessons`, `GET /api/modules/:moduleId/lessons`
- **Exercise CRUD APIs**: `POST/PATCH/DELETE /api/admin/exercises` (backend ready, frontend pending)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Platform Purpose & Architecture

**Replit = Authentication-Only Platform**:
- Serves **ONLY authenticated users** with dashboard and course player
- **NO public marketing pages** (all handled by WordPress)
- Purpose: Secure course content delivery to enrolled students only

**WordPress = Public-Facing Platform**:
- Handles ALL public pages: homepage, about, course listings, clinic info
- WooCommerce manages all sales and payments
- Sends enrollment data to Replit via webhooks

**Integration Points**:
- WooCommerce webhook (pending): Automatic enrollment on purchase
- Manual admin enrollment: Backup/testing enrollment method

### Frontend Architecture

The frontend uses React 18 with TypeScript and Vite. Wouter handles client-side routing with these routes:
- `/`: Landing page (Hero Slider + Footer) with auto-redirect to `/dashboard` for authenticated users
- `/dashboard`: User dashboard showing enrolled courses only (authentication required)
- `/corsi/:id/player`: CoursePlayer for enrolled users (authentication + enrollment required)
- `/community`: Community discussion board (authentication required)
- `/admin/*`: Admin panel pages (admin authentication required)

State management relies on TanStack Query for server state. UI components are built with Radix UI primitives and styled using Tailwind CSS, following a shadcn/ui pattern. The styling uses HSL values with CSS custom properties for theming and Montserrat/Inter fonts.

### Backend Architecture

The backend is an Express.js server with TypeScript, serving API endpoints and static assets. It features a RESTful API with route handlers organized by resource. A storage abstraction layer (`server/storage.ts`) encapsulates all database operations. Express middleware handles JSON parsing, logging, and error handling, along with session management. In development, the Vite dev server provides HMR; in production, pre-built static assets are served.

### Data Storage

PostgreSQL, hosted on Neon, is the primary database, accessed via the `@neondatabase/serverless` driver. Drizzle ORM provides type-safe queries and schema management. The database schema includes:
- **Core Tables**: `users`, `courses`, `modules`, `lessons`, `exercises`, `enrollments`
- **Progress Tracking**: `lessonProgress`, `exerciseProgress`, `certificates`
- **Community**: `posts`, `comments`, `badges`
- **CMS**: `heroSlides`, `pageHeaders`, `customPages`, `pageBlocks`
- **Newsletter**: `newsletterContacts`, `newsletterCampaigns`, `newsletterEvents`
- **Referrals**: `referralCodes`, `referralEarnings`
- **Sessions**: `sessions` (Express session storage)

**Note**: All clinic-related tables (`clinics`, `clinic_registrations`) have been completely removed from the system.

Session data is stored in a `sessions` table. Drizzle Kit manages schema migrations. The platform includes a production database seeding system to populate content from development (hero slides, page headers, courses, custom pages with blocks).

### Authentication & Authorization

The platform supports **dual authentication**: Replit Auth (OpenID Connect) and local email/password authentication. Both systems use Passport.js strategies. Session management uses Express sessions stored in PostgreSQL with secure HTTP-only cookies. The `users` table stores profile data from both auth methods. The `isAuthenticated` and `isAdmin` middleware support both auth types using the pattern: `req.user?.claims?.sub || req.user?.id`. Authorization is supported via `userLevel` and `isAdmin` fields. Admin users can access all content regardless of creator. Security measures include `httpOnly` and `secure` cookie flags, password hashing with bcrypt, and CSRF protection.

### UI/UX Decisions

The design features a surf-culture aesthetic with a turquoise and ocean-blue color palette. Hero sliders and page headers are customizable, supporting images, titles, subtitles, and optional logos with size and position controls. 

**Advanced Page Builder CMS**: Custom pages feature a professional page builder system similar to Elementor/WordPress with:
- **Menu Integration**: Pages can be published to header menu, footer menu, or kept hidden
- **Text Blocks**: Visual editor with full typography controls (font family, size, weight, line-height, letter-spacing, color, alignment) and spacing/padding controls
- **Image Blocks**: File upload support with dimension controls, aspect ratios, and alignment options
- **Banner Blocks**: Boxed and fullwidth variants with background images/colors and CTA support
- **Layout Containers**: Column and row-based layouts with configurable gap and spacing
- **Gallery Blocks**: Multiple variants (carousel, masonry, grid) with controls for columns, spacing, and item limits
- **Spacing System**: Global padding/margin controls between all blocks

Typography uses Montserrat for headers and Inter for body text.

### Technical Implementations

The project is structured as a full-stack TypeScript monorepo. It uses `zod` for schema validation and `date-fns` for date handling. Server-side image uploads are managed directly to Google Cloud Storage (GCS) into a `/public/` directory, returning public GCS URLs. A system is in place to export development data (hero slides, page headers, courses, custom pages with blocks) to a `production-seed-data.json` file, which automatically seeds the production database on first deploy.

**Newsletter System**: Integrated SendGrid-based newsletter management with contact management, campaign creation, double opt-in subscription, email tracking via webhooks, GDPR compliance (IP tracking, timestamps), and automated cron job for scheduled campaigns.

## External Dependencies

*   **Authentication**: Replit Auth (OpenID Connect)
*   **Database**: Neon Serverless PostgreSQL
*   **Payment Processing**: Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`) - Note: Currently deprecated, WooCommerce handles all payments
*   **Date Handling**: `date-fns`
*   **Form Validation**: `@hookform/resolvers` with Zod
*   **UI Components**: Radix UI primitives (`@radix-ui/react-*`)
*   **Build Tools**: Vite, esbuild, Drizzle Kit
*   **Replit Specific**: `@replit/vite-plugin-*`
