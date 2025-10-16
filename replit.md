# Scuola di Longboard Platform - Replit.md

## Overview

Scuola di Longboard is a comprehensive web-based learning management system (LMS) for a surf and longboard school. The platform enables students to browse and enroll in courses, track their progress, participate in community discussions, and register for surf camps. It serves three primary user types: students (who learn), instructors (who teach), and administrators (who manage the platform).

The application is built as a full-stack TypeScript monorepo using React for the frontend, Express for the backend, and PostgreSQL (via Neon) for data persistence. It incorporates Replit's authentication system for user management and follows a modern, surf-culture-inspired design aesthetic with a turquoise and ocean-blue color palette.

## Recent Changes (October 15, 2025)

### Hybrid CMS System - Complete Implementation
- **Implemented full hybrid CMS** with two complementary subsystems:
  1. **PageHeaders System**: Customizable hero headers for existing pages (Courses, Surf Camp, Community, Dashboard)
  2. **Custom Pages System**: Fully CMS-managed pages with block-based content builder

- **Database Schema (3 tables)**:
  - `page_headers`: Header customization for existing pages (page key, imageUrl, title, subtitle)
  - `custom_pages`: Custom pages with SEO (slug, title, headerImageUrl, published, seoTitle, seoDescription)
  - `page_blocks`: Composable blocks for custom pages (type, order, contentJson)

- **Backend API (15+ routes)**:
  - PageHeaders: GET /api/page-headers, GET /api/page-headers/:page, PUT /api/page-headers/:page
  - Custom Pages: GET /api/custom-pages, GET /api/custom-pages/slug/:slug, POST/PUT/DELETE
  - Page Blocks: GET/POST/PUT/DELETE blocks, PUT /api/page-blocks/reorder
  - Security: Public API filters unpublished pages, 404 handling for missing records

- **Frontend Components**:
  - **PageHeader**: Reusable hero component with background image, title, subtitle overlay
  - **Block Renderers**: TextBlock (HTML), ImageBlock (image+caption), CTABlock (call-to-action), GalleryBlock (multi-image), VideoBlock (embedded video)
  - **DynamicPage**: Route /p/:slug for custom pages with SEO metadata
  - **Integration**: PageHeader integrated in all existing pages + CourseDetail

- **Initial Data**:
  - 4 pageHeaders created for existing pages with Italian content
  - Example custom page "Chi Siamo" (/p/chi-siamo) with 3 blocks demonstrating system
  - All using existing object storage images

- **Admin Menu**: Added "Intestazioni Pagine" and "Pagine Custom" entries (implementation pending)

### Hero Slider Enhancement - Optional Logo System
- **Removed fixed logo** from hero slider that was appearing on all slides
- **Added optional per-slide logo** feature with full customization:
  - `logoUrl`: Optional image upload for each slide (MediaUploadZone component)
  - `logoSize`: Three size options (small: h-24-40, medium: h-32-52, large: h-48-72)
  - `logoPosition`: Display logo before or after text content
- **Admin interface updated** with new logo upload zone and size/position controls in dedicated section
- **Database schema updated** with new columns: logo_url (nullable), logo_size (default 'medium'), logo_position (default 'before')
- **Zod schema automatically updated** via createInsertSchema to include logo fields

### Object Storage Bug Fix
- **Fixed critical bug** in GET /objects/* endpoint that was preventing images from loading
- Corrected path construction from `/${req.params[0]}` to `/objects/${req.params[0]}`
- All uploaded images now serve correctly from Object Storage

### UI Size Adjustments
- **Hero slider logo sizes** increased 60%: h-40 sm:h-52 md:h-64 (was h-24 sm:h-32 md:h-40)
- **Navbar logo size** increased 50%: h-24 (was h-16)
- **Navbar height** adjusted to h-28 (was h-20) to accommodate larger logo

## Production Database Seeding

The platform includes an automated system to populate the production database with content from development. This ensures uploaded images, configured headers, and created content are available when publishing the app.

### How It Works

1. **Export Development Data** (run in development):
   ```bash
   tsx scripts/export-data.ts
   ```
   This exports the following data from your development database:
   - Hero slider slides (images, text, CTAs, logos)
   - Page headers (for all pages including custom course/camp pages)
   - Courses (basic info - modules/lessons not included)
   - Surf camps
   - Custom pages with their content blocks

2. **Data File**: Exported to `scripts/production-seed-data.json` (~11KB with current data)

3. **Automatic Production Seed**: When the app starts in production (NODE_ENV=production):
   - Checks if database is already seeded (looks for existing hero slides)
   - If empty, loads data from `scripts/production-seed-data.json`
   - Inserts all exported data into production database
   - Runs only once (won't overwrite existing data)

### Workflow for Publishing

1. **In Development**:
   - Upload images via admin panels
   - Configure hero slides, page headers
   - Create courses, surf camps, custom pages
   - Run export: `tsx scripts/export-data.ts`
   - Commit changes (includes the JSON file)

2. **Publishing**:
   - Click "Publish" button in Replit
   - Production server starts and auto-seeds database
   - All your content and images are live!

3. **Updating Content**:
   - Make changes in development
   - Re-export: `tsx scripts/export-data.ts`
   - Commit and re-publish
   - **Note**: Production seed only runs on EMPTY database. To update existing production data, you'll need to manually clear the production database first or implement a migration strategy.

### Technical Details

**Files**:
- `scripts/export-data.ts`: Export script for development data
- `server/seed.ts`: Contains `seedProductionDatabase()` function
- `server/index.ts`: Calls seed function on startup (production only)
- `scripts/production-seed-data.json`: Committed data file

**What's Included**:
- ✅ Hero slides with images from Object Storage
- ✅ Page headers (static pages + dynamic course/camp pages)
- ✅ Courses (basic info only - for display in course list)
- ✅ Surf camps
- ✅ Custom pages + content blocks

**What's NOT Included**:
- ❌ Users (managed by Replit Auth)
- ❌ Course modules/lessons (too much data, not needed for production display)
- ❌ Enrollments/progress tracking
- ❌ Community posts/comments

**Object Storage**: Images are stored in Replit Object Storage (bucket ID in env vars). The same bucket is used in both development and production, so image URLs work seamlessly.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and bundler.

**Routing**: Wouter is used for client-side routing, providing a lightweight alternative to React Router. Routes are defined in `client/src/App.tsx` with both public and protected routes.

**State Management**: TanStack Query (React Query) handles server state management, caching, and synchronization. No additional global state management library is used - component state and React Query cover all needs.

**UI Component Library**: Radix UI primitives provide accessible, unstyled components that are styled using Tailwind CSS. The design system follows the shadcn/ui pattern with components located in `client/src/components/ui/`.

**Styling**: Tailwind CSS with custom design tokens defined in `tailwind.config.ts` and `client/src/index.css`. The color system uses HSL values with CSS custom properties for theme support (light/dark modes). Typography uses Montserrat for headers and Inter for body text.

**Design Rationale**: This stack prioritizes developer experience with TypeScript safety, component reusability through Radix UI, and rapid styling via Tailwind. React Query eliminates the need for complex state management while providing excellent caching and optimistic updates.

### Backend Architecture

**Framework**: Express.js server with TypeScript, serving both API endpoints and static assets in production.

**API Design**: RESTful API with route handlers organized in `server/routes.ts`. Routes follow resource-based naming (e.g., `/api/courses`, `/api/enrollments`).

**Database Access Layer**: A storage abstraction layer (`server/storage.ts`) encapsulates all database operations, providing a clean interface between routes and the database. This enables easier testing and potential database migrations.

**Middleware**: Express middleware handles JSON parsing, URL encoding, request logging, and error handling. Session middleware manages authentication state.

**Development Server**: Vite dev server is integrated in development mode (`server/vite.ts`) to provide HMR and fast refresh. In production, pre-built static assets are served from the `dist/public` directory.

**Rationale**: The storage layer abstraction provides clean separation of concerns and makes the codebase more maintainable. Express was chosen for its maturity, extensive middleware ecosystem, and straightforward request/response handling.

### Data Storage

**Database**: PostgreSQL hosted on Neon (serverless Postgres), accessed via the `@neondatabase/serverless` driver with WebSocket support for optimal performance.

**ORM**: Drizzle ORM provides type-safe database queries and schema management. Schema definitions in `shared/schema.ts` generate TypeScript types automatically.

**Schema Design**: The database uses a relational model with the following core entities:
- **users**: User profiles with authentication data
- **courses**: Learning courses with metadata (level, price, duration)
- **modules**: Course sections containing related lessons
- **lessons**: Individual learning units with video content
- **exercises**: Practical exercises for skill development
- **enrollments**: Junction table tracking course registrations
- **progress tracking**: Tables for lesson and exercise completion
- **community features**: Posts, comments for discussion
- **surf camps**: Event management with registrations
- **certificates**: Achievement tracking

**Sessions**: Session data is stored in a dedicated `sessions` table using `connect-pg-simple`, required for Replit Auth integration.

**Migrations**: Drizzle Kit manages schema migrations with files stored in the `migrations/` directory. The `db:push` script synchronizes schema changes to the database.

**Rationale**: PostgreSQL provides ACID guarantees, complex query support, and excellent performance. Drizzle ORM was chosen over alternatives like Prisma for its lightweight nature, better type inference, and SQL-like query API. Neon's serverless architecture eliminates database management overhead.

### Authentication & Authorization

**Authentication Provider**: Replit Auth (OpenID Connect) handles user authentication. The integration is in `server/replitAuth.ts` using Passport.js strategy.

**Session Management**: Express sessions stored in PostgreSQL with secure HTTP-only cookies. Session duration is 7 days with automatic renewal.

**User Model**: The `users` table stores profile data synced from Replit Auth. The `upsertUser` pattern ensures users are created or updated on each login.

**Protected Routes**: The `isAuthenticated` middleware in `server/replitAuth.ts` protects API routes requiring authentication. Frontend components use the `useAuth` hook to check authentication status.

**Authorization**: Role-based access is supported via the `userLevel` field (beginner/intermediate/advanced), though fine-grained permissions aren't currently implemented.

**Security**: 
- Cookies use `httpOnly` and `secure` flags in production
- CSRF protection via `sameSite` cookie attribute
- Passwords are never stored (handled by Replit Auth)

**Rationale**: Replit Auth eliminates the need to build authentication infrastructure, provides social login, and integrates seamlessly with the Replit ecosystem. Session-based auth (vs JWT) was chosen for better security (sessions can be invalidated server-side) and simpler implementation.

### External Dependencies

**Authentication**: Replit Auth (OpenID Connect) - Provides user authentication and profile management.

**Database**: Neon Serverless PostgreSQL - Cloud-hosted database with connection pooling and WebSocket support.

**Payment Processing**: Stripe integration (via `@stripe/stripe-js` and `@stripe/react-stripe-js`) - Handles course payments and surf camp registrations. Implementation appears incomplete in the current codebase.

**Date Handling**: `date-fns` library with Italian locale support for formatting dates and relative time display.

**Form Validation**: `@hookform/resolvers` with Zod schemas provides type-safe form validation on both client and server.

**UI Components**: Radix UI primitives (`@radix-ui/react-*`) - Unstyled, accessible component library forming the foundation of the UI system.

**Build Tools**: 
- Vite - Frontend build tool and dev server
- esbuild - Backend bundling for production
- Drizzle Kit - Database migration management

**Replit-Specific**: Development plugins from `@replit/vite-plugin-*` provide IDE integration, runtime error overlays, and cartographer support.