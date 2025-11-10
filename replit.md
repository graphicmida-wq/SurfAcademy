# Scuola di Longboard Platform

## Overview

Scuola di Longboard is a comprehensive web-based learning management system (LMS) for a surf and longboard school. It allows students to enroll in courses, track progress, participate in community discussions, and register for surf clinics (single-day lessons scheduled during optimal wave conditions). The platform supports students, instructors, and administrators with role-specific dashboards and features. It's a full-stack TypeScript monorepo using React, Express, and PostgreSQL (via Neon), integrated with Replit's authentication. The design is inspired by surf culture with a turquoise and ocean-blue palette.

### Recent Changes (Nov 2025)

**Clinic Waiting Period System - Complete Implementation** ✅:
- **Waiting Period Workflow**: Added `activationStatus` (waitlist/active) and `purchasableFrom` fields to clinics schema with migration
- **Admin Waitlist Management**: 
  - GET `/api/admin/clinics` now returns `ClinicWithWaitlistCount` type with real-time waitlist counts
  - AdminClinics.tsx displays waitlist badge with count for each clinic
  - Toggle switch allows admin to activate clinics (waitlist → active) instantly
  - Visual feedback with CheckCircle2 icon for active clinics, Clock icon for waitlist
- **User Experience**:
  - Clinic.tsx list page with "Dettagli" links to individual clinic pages
  - ClinicDetail page with dynamic CTAs: "Lista d'attesa" (waitlist), "Prenota Ora" (shows toast pending Stripe), "Sold Out" (full)
  - AuthPrompt component for inline login/signup without page redirect
  - Real-time spot tracking (X/Y format) with "Sold Out" badge when full
  - Configurable image gallery with switch-based column mapping (1-6 cols), aspect ratios, and layout variants (grid/masonry/carousel)
  - HTML description rendering with proper formatting
- **Backend APIs**: GET `/api/clinics/:id` with user registration status, POST `/api/clinics/:id/waitlist`, PATCH `/api/admin/clinics/:id/activate`, GET `/api/admin/clinics/:id/registrations`
- **Type Safety**: Created `ClinicWithWaitlistCount` shared type extending Clinic with waitlistCount for admin views
- **Next Step**: Stripe integration for clinic checkout (requires VITE_STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY configuration)

**Complete "SurfDay" to "Clinic" Refactoring**:
- **Database Migration**: Renamed tables `surf_days` → `clinics`, `surf_day_registrations` → `clinic_registrations` while preserving all data
- **Schema Updates**: Updated `shared/schema.ts` with new table names, types, relations, and insert schemas
- **Storage Layer**: Refactored all storage interface methods and implementations from SurfDay → Clinic naming
- **API Routes**: Changed all endpoints from `/api/surf-days` → `/api/clinics`
- **Frontend Pages**: Renamed `SurfDay.tsx` → `Clinic.tsx` with "Dettagli" links to individual clinic pages
- **Routing**: Updated App.tsx routes: `/clinic` (list), `/clinic/:id` (detail)
- **Navigation**: Updated Navbar, Footer, AdminLayout menus to use "Clinic" terminology
- **Standardized Terminology**: Platform now consistently uses "Clinic" for single-day surf lessons

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

### Frontend Architecture

The frontend uses React 18 with TypeScript and Vite. Wouter handles client-side routing. State management relies on TanStack Query for server state. UI components are built with Radix UI primitives and styled using Tailwind CSS, following a shadcn/ui pattern. The styling uses HSL values with CSS custom properties for theming and Montserrat/Inter fonts.

### Backend Architecture

The backend is an Express.js server with TypeScript, serving API endpoints and static assets. It features a RESTful API with route handlers organized by resource. A storage abstraction layer (`server/storage.ts`) encapsulates all database operations. Express middleware handles JSON parsing, logging, and error handling, along with session management. In development, the Vite dev server provides HMR; in production, pre-built static assets are served.

### Data Storage

PostgreSQL, hosted on Neon, is the primary database, accessed via the `@neondatabase/serverless` driver. Drizzle ORM provides type-safe queries and schema management. The database schema includes `users`, `courses`, `modules`, `lessons`, `exercises`, `enrollments`, `progress tracking`, `community features`, `clinics` (single-day surf lessons), `clinic_registrations`, `newsletter` system, and `certificates`. Session data is stored in a `sessions` table. Drizzle Kit manages schema migrations. The platform also includes a production database seeding system to populate content from development.

### Authentication & Authorization

The platform supports **dual authentication**: Replit Auth (OpenID Connect) and local email/password authentication. Both systems use Passport.js strategies. Session management uses Express sessions stored in PostgreSQL with secure HTTP-only cookies. The `users` table stores profile data from both auth methods. The `isAuthenticated` and `isAdmin` middleware support both auth types using the pattern: `req.user?.claims?.sub || req.user?.id`. Authorization is supported via `userLevel` and `isAdmin` fields. Admin users can access all content regardless of creator. Security measures include `httpOnly` and `secure` cookie flags, password hashing with bcrypt, and CSRF protection.

### UI/UX Decisions

The design features a surf-culture aesthetic with a turquoise and ocean-blue color palette. Hero sliders and page headers are customizable, supporting images, titles, subtitles, and optional logos with size and position controls. 

**Advanced Page Builder CMS**: Custom pages now feature a professional page builder system similar to Elementor/WordPress with:
- **Menu Integration**: Pages can be published to header menu, footer menu, or kept hidden
- **Text Blocks**: Visual editor with full typography controls (font family, size, weight, line-height, letter-spacing, color, alignment) and spacing/padding controls
- **Image Blocks**: File upload support with dimension controls, aspect ratios, and alignment options
- **Banner Blocks**: Boxed and fullwidth variants with background images/colors and CTA support
- **Layout Containers**: Column and row-based layouts with configurable gap and spacing
- **Gallery Blocks**: Multiple variants (carousel, masonry, grid) with controls for columns, spacing, and item limits
- **Spacing System**: Global padding/margin controls between all blocks

Typography uses Montserrat for headers and Inter for body text.

### Technical Implementations

The project is structured as a full-stack TypeScript monorepo. It uses `zod` for schema validation and `date-fns` for date handling. Server-side image uploads are managed directly to Google Cloud Storage (GCS) into a `/public/` directory, returning public GCS URLs. A system is in place to export development data (hero slides, page headers, courses, clinics, custom pages with blocks) to a `production-seed-data.json` file, which automatically seeds the production database on first deploy.

**Newsletter System**: Integrated SendGrid-based newsletter management with contact management, campaign creation, double opt-in subscription, email tracking via webhooks, GDPR compliance (IP tracking, timestamps), and automated cron job for scheduled campaigns.

## External Dependencies

*   **Authentication**: Replit Auth (OpenID Connect)
*   **Database**: Neon Serverless PostgreSQL
*   **Payment Processing**: Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
*   **Date Handling**: `date-fns`
*   **Form Validation**: `@hookform/resolvers` with Zod
*   **UI Components**: Radix UI primitives (`@radix-ui/react-*`)
*   **Build Tools**: Vite, esbuild, Drizzle Kit
*   **Replit Specific**: `@replit/vite-plugin-*`