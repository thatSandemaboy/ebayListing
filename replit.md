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
- **Key Tables**: 
  - `inventory_items` - Core inventory data with WholeCell integration
  - `photos` - Individual photos linked to items via foreign key
  - `ebay_listings` - Complete eBay listing data (title, condition, price, description HTML)
  - `ebay_item_specifics` - Key-value pairs for eBay Item Specifics (Brand, Model, etc.)

### eBay Listings Structure
- **Item Specifics**: Structured key-value pairs matching eBay's format (Brand, Model, Color, Storage, Network, etc.)
- **Description HTML**: Formatted HTML with sections for Product Description, Condition, What's Included, Key Features
- **Condition Mapping**: Maps inventory conditions to eBay conditions (New, Open box, Used, For parts, etc.)

### eBay API Integration
- **OAuth 2.0 Flow**: User authorization via eBay consent screen, tokens stored in `ebay_tokens` table
- **Inventory API**: Creates inventory items and offers (draft listings) on eBay
- **Token Management**: Automatic refresh of expired access tokens using refresh token
- **Push to eBay**: Single-click push from listing editor creates draft listing on eBay Seller Hub
- **Sandbox/Production**: Automatically uses sandbox API in development, production API in deployed mode

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `WHOLECELL_APP_KEY` - WholeCell API authentication key
- `WHOLECELL_APP_SECRET` - WholeCell API authentication secret
- `EBAY_CLIENT_ID` - eBay Developer App ID (OAuth Client ID)
- `EBAY_CLIENT_SECRET` - eBay Developer Cert ID (OAuth Client Secret)