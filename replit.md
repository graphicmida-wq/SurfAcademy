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

The frontend uses React 18, TypeScript, and Vite. Wouter manages client-side routing for the landing page (auto-redirect to `/dashboard` for authenticated users), `/dashboard`, `/corsi/:id/player` (course player), `/community`, and `/admin/*` pages. State management uses TanStack Query. UI components are built with Radix UI primitives and styled with Tailwind CSS, following a shadcn/ui pattern. The design uses HSL values, CSS custom properties for theming, and Montserrat/Inter fonts.

### Backend Architecture

The backend is an Express.js server with TypeScript, providing RESTful API endpoints. A storage abstraction layer (`server/storage.ts`) handles database operations. Express middleware is used for JSON parsing, logging, error handling, and session management.

### Data Storage

PostgreSQL, hosted on Neon, is the primary database, accessed via `@neondatabase/serverless` and Drizzle ORM. The schema includes tables for `users`, `courses`, `modules`, `lessons`, `exercises`, `enrollments`, `lessonProgress`, `exerciseProgress`, `certificates`, `posts`, `comments`, `badges`, `heroSlides`, `pageHeaders`, `customPages`, `pageBlocks`, `newsletterContacts`, `newsletterCampaigns`, `newsletterEvents`, `referralCodes`, `referralEarnings`, and `sessions`. Drizzle Kit manages schema migrations. A production database seeding system populates content from development.

### Authentication & Authorization

The platform supports dual authentication: Replit Auth (OpenID Connect) and local email/password, both using Passport.js strategies. Session management uses Express sessions stored in PostgreSQL with secure HTTP-only cookies. Authorization is handled via `userLevel` and `isAdmin` fields. Admin users have full access. Security includes `httpOnly` and `secure` cookie flags, bcrypt for password hashing, and CSRF protection.

### UI/UX Decisions

The design reflects a surf-culture aesthetic with a turquoise and ocean-blue palette. Customizable hero sliders and page headers support images, titles, subtitles, and optional logos. An advanced page builder CMS allows for creating custom pages with text, image, banner, layout container, and gallery blocks. Typography uses Montserrat for headers and Inter for body text.

### Technical Implementations

The project is a full-stack TypeScript monorepo. It uses `zod` for schema validation and `date-fns` for date handling. Server-side image uploads are managed directly to Google Cloud Storage (GCS). A system exports development data to a `production-seed-data.json` file for seeding the production database. A SendGrid-based newsletter system includes contact management, campaign creation, double opt-in, email tracking, and GDPR compliance.

## External Dependencies

*   **Authentication**: Replit Auth (OpenID Connect)
*   **Database**: Neon Serverless PostgreSQL
*   **Date Handling**: `date-fns`
*   **Form Validation**: Zod
*   **UI Components**: Radix UI primitives
*   **Build Tools**: Vite, esbuild, Drizzle Kit
*   **Replit Specific**: `@replit/vite-plugin-*`