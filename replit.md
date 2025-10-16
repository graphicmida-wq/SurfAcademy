# Scuola di Longboard Platform

## Overview

Scuola di Longboard is a comprehensive web-based learning management system (LMS) for a surf and longboard school. It allows students to enroll in courses, track progress, participate in community discussions, and register for surf camps. The platform supports students, instructors, and administrators. It's a full-stack TypeScript monorepo using React, Express, and PostgreSQL (via Neon), integrated with Replit's authentication. The design is inspired by surf culture with a turquoise and ocean-blue palette.

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

Replit Auth (OpenID Connect) handles user authentication using a Passport.js strategy. Session management uses Express sessions stored in PostgreSQL with secure HTTP-only cookies. The `users` table stores profile data synced from Replit Auth. The `isAuthenticated` middleware protects API routes. Authorization is supported via a `userLevel` field. Security measures include `httpOnly` and `secure` cookie flags, and CSRF protection.

### UI/UX Decisions

The design features a surf-culture aesthetic with a turquoise and ocean-blue color palette. Hero sliders and page headers are customizable, supporting images, titles, subtitles, and optional logos with size and position controls. A hybrid CMS system allows for fully customizable pages with block-based content (text, image, CTA, gallery, video). Typography uses Montserrat for headers and Inter for body text.

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