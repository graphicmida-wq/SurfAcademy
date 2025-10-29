# Scuola di Longboard Platform

## Overview

Scuola di Longboard is a comprehensive web-based learning management system (LMS) for a surf and longboard school. It allows students to enroll in courses, track progress, participate in community discussions, and register for surf camps. The platform supports students, instructors, and administrators with role-specific dashboards and features. It's a full-stack TypeScript monorepo using React, Express, and PostgreSQL (via Neon), integrated with Replit's authentication. The design is inspired by surf culture with a turquoise and ocean-blue palette.

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
- **Complete CRUD for Modules**: Full create/update/delete operations for course modules with `title`, `description`, and `orderIndex` fields
- **Complete CRUD for Lessons**: Full create/update/delete operations for lessons with support for multiple video URLs, PDF uploads, HTML content, and `contentType` categorization
- **Content Management UI** at `/admin/corsi/contenuti`:
  - Three-level hierarchy: Course → Modules → Lessons
  - Visual cards displaying modules with lesson counts
  - Dialog-based forms for creating/editing modules and lessons
  - MediaUploadZone integration for video and PDF uploads
  - Real-time updates via TanStack Query cache invalidation
- **Quick Access Link**: "Gestisci Contenuti" button added to each course card in AdminCourses page

**Backend API Enhancements**:
- `PUT /api/profile`: Profile update endpoint with Zod validation and email uniqueness checking
- `GET /api/wavepoints`: Retrieves user's WavePoints balance from referral earnings
- `GET /api/admin/enrollments`: Admin-only endpoint returning all users with their enrollments and progress data
- `POST /api/admin/enroll/:courseId`: Admin-only instant enrollment without payment
- **Module CRUD APIs**: `POST/PATCH/DELETE /api/admin/modules`, `GET /api/courses/:courseId/modules`
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

PostgreSQL, hosted on Neon, is the primary database, accessed via the `@neondatabase/serverless` driver. Drizzle ORM provides type-safe queries and schema management. The database schema includes `users`, `courses`, `modules`, `lessons`, `exercises`, `enrollments`, `progress tracking`, `community features`, `surf camps`, and `certificates`. Session data is stored in a `sessions` table. Drizzle Kit manages schema migrations. The platform also includes a production database seeding system to populate content from development.

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

The project is structured as a full-stack TypeScript monorepo. It uses `zod` for schema validation and `date-fns` for date handling. Server-side image uploads are managed directly to Google Cloud Storage (GCS) into a `/public/` directory, returning public GCS URLs. A system is in place to export development data (hero slides, page headers, courses, surf camps, custom pages with blocks) to a `production-seed-data.json` file, which automatically seeds the production database on first deploy.

## External Dependencies

*   **Authentication**: Replit Auth (OpenID Connect)
*   **Database**: Neon Serverless PostgreSQL
*   **Payment Processing**: Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
*   **Date Handling**: `date-fns`
*   **Form Validation**: `@hookform/resolvers` with Zod
*   **UI Components**: Radix UI primitives (`@radix-ui/react-*`)
*   **Build Tools**: Vite, esbuild, Drizzle Kit
*   **Replit Specific**: `@replit/vite-plugin-*`