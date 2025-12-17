# eBay Listing Generator - Change Log

## December 2024

### WholeCell Integration
- **WholeCell API Integration**: Connected to WholeCell inventory management system to fetch items marked as "Needs eBay Draft".
- **Inventory Sync with SSE Progress**: Added real-time progress bar showing sync status using Server-Sent Events.
- **Incremental Sync**: Optimized sync to only fetch items updated since last sync, dramatically reducing sync time.
- **Removed Photo Fetching**: Eliminated unnecessary photo API calls since photos are managed separately.

### Inventory Table Features
- **Collapsible SKU Groups**: Items with the same SKU are grouped together with expand/collapse functionality.
- **Group Selection Checkboxes**: Select all items in a group with a single checkbox click.
- **Aggregated Status Badges**: Groups show combined status counts when items have mixed statuses.
- **Sortable Table Headers**: Click column headers to sort by name, condition, status, listed, or last updated.

### Database Schema
- **Inventory Items Table**: Stores synced items with WholeCell ID, product details, condition, status, and pricing.
- **Sync Metadata Table**: Tracks last sync timestamp to enable incremental updates.

### Performance Optimizations
- **SSE Flush for Progress Updates**: Ensured progress bar updates stream properly to the client.
- **Error Retry Logic**: Failed sync items are retried on next sync by not advancing timestamp when errors occur.
