# eBay Listing Generator

## Overview

An eBay listing generator application that streamlines the process of creating eBay listings from inventory items. The app integrates with WholeCell inventory management system to fetch items marked as "ready for eBay listing," allows photo capture/management, uses AI to generate listing descriptions, and exports completed listings to CSV format for eBay import.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state, React Context for app-level state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration, using CSS variables for theming
- **Animations**: Framer Motion for UI transitions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints under `/api/*` prefix
- **Development**: tsx for TypeScript execution, Vite dev server with HMR for frontend

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)
- **Key Tables**: 
  - `users` - Basic user authentication
  - `inventory_items` - Core inventory data with WholeCell integration, photos, listings, and status tracking

### Build and Deployment
- **Frontend Build**: Vite outputs to `dist/public`
- **Backend Build**: esbuild bundles server code to `dist/index.cjs`
- **Production**: Single Node.js process serves both API and static files

## External Dependencies

### WholeCell Integration
- **Purpose**: Fetches inventory items from external WholeCell inventory management system
- **Authentication**: Basic auth using `WHOLECELL_APP_KEY` and `WHOLECELL_APP_SECRET` environment variables
- **API Base URL**: `https://api.wholecell.io/api/v1`
- **Data Mapped**: Product info (manufacturer, model, variant, network, capacity, color), inventory status, photos

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Session Storage**: connect-pg-simple for Express session persistence

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `WHOLECELL_APP_KEY` - WholeCell API authentication key
- `WHOLECELL_APP_SECRET` - WholeCell API authentication secret