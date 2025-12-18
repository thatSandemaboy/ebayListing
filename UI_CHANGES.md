# UI Overhaul Documentation - Attio-Inspired Aesthetic

This document summarizes the user interface changes implemented to transition the eBay Listing Generator to a modern, professional, and "Attio-inspired" design.

## Core Design Principles
- **Minimalism**: Reduced visual noise by thinning borders and simplifying backgrounds.
- **Hierarchy**: Stronger typographic differentiation using font weights and standardized sizes.
- **Sophistication**: A monochromatic Zinc-based color palette with deep navy accents.
- **Micro-interactions**: Subtle entrance animations and refined hover states for a "premium" feel.

## Detailed Changes

### 1. Global Styles & Theme (`index.css`)
- **Color Palette**: 
  - Switched to a pure white background for light mode.
  - Implemented a "Zinc" monochromatic scale for secondary/muted elements.
  - Set the primary color to a deep navy (`hsl(240 5.9% 10%)`).
- **Borders & Radius**: 
  - Increased base border radius to `0.6rem` for a softer look.
  - Lightened border colors (`border-border/40`) for lower contrast.
- **Typography**: 
  - Set standard sans-serif font to 'Inter' and mono to 'JetBrains Mono'.

### 2. Layout Components
- **AppShell**: 
  - Removed the background dot grid for a cleaner, distraction-free backdrop.
  - Ensured fixed full-height layout with hidden overflow on the main container.
- **Header (`Dashboard.tsx`)**:
  - Reduced height from 16 to 14 units.
  - Updated logo styling with a bold capital "E".
  - Added a "Pro" badge for a professional SaaS feel.
  - Refined action buttons with smaller icons and consistent text sizes.
- **Sidebar (`Sidebar.tsx`)**:
  - Improved spacing and added backdrop-blur.
  - Updated search bar with focused interaction states.
  - Re-styled item cards with cleaner status indicators and subtle left-border accents for selected states.

### 3. View Components
- **Inventory Table (`InventoryTable.tsx`)**:
  - Modernized the table headers with bold uppercase labels.
  - Re-styled status indicators from heavy badges to subtle colored pips and progress bars.
  - Enhanced the "Bulk Actions" floating bar with high-contrast styling and better shadow depth.
  - Improved variants/SKU group expansion animations.
- **Item Details (`ItemDetails.tsx`)**:
  - Simplified the grid layout.
  - Replaced cards with clean borderless sections and subtle backgrounds.
  - Standardized "Metadata" labels with bold uppercase tracking.
- **Photo Manager (`PhotoManager.tsx`)**:
  - Updated action buttons to secondary variants for a softer primary interaction.
  - Enhanced the drag-and-drop zone with a refined "scan" aesthetic.
  - Improved the asset gallery with "Primary" vs "Asset" labeling and hover-zoom effects.
- **Listing Generator (`ListingGenerator.tsx`)**:
  - Redesigned the "Empty State" with a custom Sparkle icon and clear CTA.
  - Implemented a more structured "Smart Editor" layout.
  - Updated the rich text preview with a clean toggle system.

## Technical Fixes
- Fixed syntax errors (extra trailing parentheses) in `InventoryTable.tsx`, `ListingGenerator.tsx`, and `PhotoManager.tsx`.
- Resolved missing imports (`Badge`, `Clock`) in `Dashboard.tsx`.

