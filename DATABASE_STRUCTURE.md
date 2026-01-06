# Database Structure

This document describes the PostgreSQL database schema for the eBay Listing Generator application.

## Tables Overview

| Table | Description |
|-------|-------------|
| `users` | User authentication |
| `inventory_items` | Core inventory data from WholeCell |
| `sync_metadata` | Tracks sync timestamps |
| `photos` | Individual photos linked to items |
| `ebay_listings` | Complete eBay listing data |
| `ebay_item_specifics` | Key-value pairs for eBay item specifics |
| `ebay_tokens` | eBay OAuth authorization tokens |

---

## users

Stores user authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique user identifier |
| `username` | `text` | NOT NULL, UNIQUE | User's username |
| `password` | `text` | NOT NULL | User's password |

---

## inventory_items

Core inventory data synced from WholeCell inventory management system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique item identifier |
| `wholecell_id` | `integer` | UNIQUE | Link to WholeCell system |
| `name` | `text` | NOT NULL | Product name |
| `sku` | `text` | NOT NULL | Stock keeping unit |
| `condition` | `text` | NOT NULL | Item condition (e.g., "A Grade", "B Grade") |
| `status` | `text` | NOT NULL, DEFAULT `'new'` | Workflow status: `'new'`, `'photos_completed'`, `'listing_generated'` |
| `listed` | `boolean` | NOT NULL, DEFAULT `false` | Whether item is listed on eBay |
| `created_at` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation timestamp |
| `last_updated` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Last update timestamp |
| `details` | `jsonb` | NOT NULL | Product details object (see below) |
| `photos` | `text[]` | NOT NULL, DEFAULT `ARRAY[]::text[]` | Array of photo URLs |
| `listing` | `jsonb` | - | Legacy listing data (title, description, price, category) |
| `sale_price` | `real` | - | Sale price in dollars |
| `total_price_paid` | `real` | DEFAULT `0` | Cost paid for item |
| `warehouse` | `text` | - | Warehouse location |
| `location` | `text` | - | Specific location within warehouse |

### Details JSONB Structure

```json
{
  "brand": "Apple iPhone",
  "model": "IPHONE 16",
  "color": "Black",
  "storage": "128Gb",
  "variant": "A3081",
  "network": "Unlocked",
  "esn": "350465824326111",
  "hexId": "41J9",
  "grade": "C Grade",
  "conditions": ["Frame Dings", "Deep Screen Scratches"]
}
```

---

## sync_metadata

Tracks synchronization timestamps and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique record identifier |
| `key` | `text` | NOT NULL, UNIQUE | Metadata key (e.g., `'last_sync'`) |
| `value` | `text` | NOT NULL | Metadata value |
| `updated_at` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Last update timestamp |

---

## photos

Individual photos linked to inventory items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique photo identifier |
| `item_id` | `varchar` | NOT NULL, REFERENCES `inventory_items(id)` ON DELETE CASCADE | Parent item ID |
| `url` | `text` | NOT NULL | Photo URL |
| `created_at` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Upload timestamp |

---

## ebay_listings

Complete eBay listing data including description, pricing, and policies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique listing identifier |
| `item_id` | `varchar` | NOT NULL, REFERENCES `inventory_items(id)` ON DELETE CASCADE | Parent item ID |
| `status` | `text` | NOT NULL, DEFAULT `'draft'` | Listing status: `'draft'`, `'ready'`, `'published'` |
| `title` | `text` | NOT NULL | eBay listing title (max 80 chars) |
| `category_id` | `text` | - | eBay category ID |
| `category_path` | `text` | - | Category path (e.g., "Electronics > Phones") |
| `condition` | `text` | NOT NULL | eBay condition (e.g., "For parts or not working") |
| `condition_notes` | `text` | - | Detailed condition description |
| `price` | `real` | - | Listing price in dollars |
| `description_html` | `text` | - | Full HTML description for eBay |
| `whats_included` | `text` | - | What's included with the item |
| `product_features` | `text[]` | DEFAULT `ARRAY[]::text[]` | Array of product features |
| `shipping_policy` | `text` | - | Shipping policy details |
| `return_policy` | `text` | - | Return policy details |
| `created_at` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Last update timestamp |

---

## ebay_item_specifics

Key-value pairs for eBay Item Specifics (Brand, Model, Color, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique record identifier |
| `listing_id` | `varchar` | NOT NULL, REFERENCES `ebay_listings(id)` ON DELETE CASCADE | Parent listing ID |
| `name` | `text` | NOT NULL | Specific name (e.g., "Brand", "Model", "Color") |
| `value` | `text` | NOT NULL | Specific value (e.g., "Apple", "iPhone 16", "Black") |
| `display_order` | `integer` | DEFAULT `0` | Display order for sorting |

---

## ebay_tokens

Stores eBay OAuth 2.0 authorization tokens for API access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique token record identifier |
| `access_token` | `text` | NOT NULL | eBay API access token |
| `refresh_token` | `text` | NOT NULL | Token for refreshing access |
| `expires_at` | `text` | NOT NULL | Access token expiration timestamp |
| `refresh_expires_at` | `text` | NOT NULL | Refresh token expiration timestamp |
| `token_type` | `text` | NOT NULL, DEFAULT `'Bearer'` | Token type |
| `created_at` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `text` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Last update timestamp |

---

## Entity Relationships

```
users (standalone)

inventory_items
    ├── photos (one-to-many, CASCADE delete)
    └── ebay_listings (one-to-many, CASCADE delete)
            └── ebay_item_specifics (one-to-many, CASCADE delete)

sync_metadata (standalone)

ebay_tokens (standalone)
```

---

## Notes

- All primary keys use UUID format generated by `gen_random_uuid()`
- Timestamps are stored as `text` type for compatibility
- Foreign key relationships use CASCADE delete to maintain referential integrity
- The `details` column in `inventory_items` stores flexible product attributes as JSONB
