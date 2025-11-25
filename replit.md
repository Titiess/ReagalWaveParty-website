# Regal Star Gym - Wave & Vibe Pool Party

## Overview

This is a premium event ticketing and management platform for Regal Star Gym's Wave & Vibe Pool Party. The application is a single-page, conversion-focused website with integrated payment processing, automated ticket generation, and email delivery. Built as a full-stack TypeScript application, it features a React frontend with a black and gold luxury theme, an Express backend, and Flutterwave payment integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing (Home, Purchase, Success, NotFound pages)
- Single-page application with smooth scrolling sections

**UI Component System**
- shadcn/ui component library (New York style) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom black and gold color scheme defined in CSS variables
- Montserrat font family from Google Fonts for premium typography
- Mobile-first responsive design approach

**State Management**
- React Hook Form with Zod validation for form handling
- TanStack Query (React Query) for server state management and API caching
- Custom toast notifications for user feedback

**Design System**
- Premium luxury aesthetic with black (#000000) and gold (#D4AF37) color palette
- Consistent spacing using Tailwind's spacing scale
- Card-based layouts with subtle animations and elevation effects
- Form inputs with gold focus states
- Comprehensive component library including buttons, cards, forms, dialogs, and more

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the API server
- Separate development and production entry points (index-dev.ts, index-prod.ts)
- Development mode includes Vite middleware for HMR
- Production mode serves static built files

**API Design**
- RESTful endpoints for ticket operations
- Payment initialization endpoint that integrates with Flutterwave
- Webhook-style success handling via query parameters
- Request/response logging middleware for debugging

**Data Layer**
- In-memory storage implementation (MemStorage) for development/simple deployments
- Schema definition using Drizzle ORM with PostgreSQL dialect
- Ticket model includes: id, ticketId (RSG-PPOOL-XXXXXX format), name, email, gender, amount, paymentStatus, flutterwaveRef, createdAt
- Storage interface allows for easy database implementation swap

**Business Logic**
- Ticket ID generation with format "RSG-PPOOL-{6-digit-random}"
- Dynamic pricing based on gender (Early Bird: 5000 for male, 3000 for female; Gate: 8000)
- Payment status tracking (pending, successful, failed)
- PDF ticket generation with QR codes
- Automated email delivery after successful payment

### External Dependencies

**Payment Gateway**
- Flutterwave integration for payment processing
- Requires environment variables:
  - FLUTTERWAVE_PUBLIC_KEY: Public key for frontend payment initialization
  - FLUTTERWAVE_SECRET_KEY: Secret key for backend API calls
  - FLUTTERWAVE_WEBHOOK_SECRET (optional): Dedicated webhook verification secret; falls back to SECRET_KEY if not provided
- Webhook verification supports both verif-hash (simple comparison) and flutterwave-signature (HMAC-SHA256) methods
- Standard Flutterwave payment flow with redirect URLs
- Transaction reference (tx_ref) tied to ticket ID for reconciliation
- Webhook validates currency (NGN), amount, email, and payment status before processing

**Email Service**
- Nodemailer for email delivery
- Gmail SMTP configuration
- Requires EMAIL_USER and EMAIL_PASSWORD environment variables
- Sends branded HTML emails with PDF ticket attachments
- Email template includes event details, ticket ID, QR code, and payment confirmation

**Database**
- Configured for PostgreSQL via Drizzle ORM
- Requires DATABASE_URL environment variable
- Currently using in-memory storage but ready for database migration
- Migration files output to ./migrations directory

**Document Generation**
- PDFKit for generating ticket PDFs
- QRCode library for generating scannable QR codes containing ticket IDs
- PDF includes event branding, ticket details, QR code, and terms

**Development Tools**
- Replit-specific plugins for development environment integration
- Source map support via @jridgewell/trace-mapping
- TypeScript compilation with strict mode enabled
- ESBuild for production bundling

**UI & Styling**
- Extensive Radix UI component primitives for accessibility
- Tailwind CSS with PostCSS for processing
- Class Variance Authority (CVA) for component variant management
- Lucide React for icons

**Type Safety**
- Zod for runtime schema validation
- Drizzle-Zod for generating Zod schemas from Drizzle tables
- TypeScript path aliases (@/, @shared/, @assets/) for clean imports