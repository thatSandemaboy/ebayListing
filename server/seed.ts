import { storage } from "./storage";
import { inventoryItems, users } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function seedInventory() {
  try {
    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        username text NOT NULL UNIQUE,
        password text NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        sku text NOT NULL,
        condition text NOT NULL,
        status text NOT NULL DEFAULT 'new',
        listed boolean NOT NULL DEFAULT false,
        last_updated text NOT NULL DEFAULT CURRENT_TIMESTAMP,
        details jsonb NOT NULL,
        photos text[] NOT NULL DEFAULT ARRAY[]::text[],
        listing jsonb
      )
    `);

    // Check if data already exists
    const existing = await storage.getInventoryItems();
    if (existing.length > 0) {
      return; // Already seeded
    }

    const mockItems = [
      {
        name: 'Apple iPhone 14 Pro - 256GB - Graphite',
        sku: 'IP14P-256-GR',
        condition: 'Excellent',
        status: 'listing_generated' as const,
        listed: true,
        details: {
          brand: 'Apple',
          model: 'iPhone 14 Pro',
          color: 'Graphite',
          storage: '256GB'
        },
        photos: [] as string[],
        listing: {
          title: 'Apple iPhone 14 Pro 256GB Graphite - Excellent Condition',
          description: 'Like new Apple iPhone 14 Pro in Graphite. Minimal wear, battery health 98%.',
          price: 999.99,
          category: 'Cell Phones & Accessories > Cell Phones'
        }
      },
      {
        name: 'MacBook Pro 14" M1 Pro - 16GB/512GB',
        sku: 'MBP14-M1-16-512',
        condition: 'Good',
        status: 'listing_generated' as const,
        listed: true,
        details: {
          brand: 'Apple',
          model: 'MacBook Pro',
          color: 'Silver',
          processor: 'M1 Pro',
          ram: '16GB',
          storage: '512GB'
        },
        photos: [] as string[],
        listing: {
          title: 'Apple MacBook Pro 14" Laptop M1 Pro Chip 16GB RAM 512GB SSD',
          description: 'MacBook Pro 14-inch with M1 Pro chip. Good condition, battery health 92%.',
          price: 1299.00,
          category: 'Computers/Tablets & Networking > Laptops & Netbooks'
        }
      },
      {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        sku: 'SNY-XM5-BLK',
        condition: 'Open Box',
        status: 'listing_generated' as const,
        listed: true,
        details: {
          brand: 'Sony',
          model: 'WH-1000XM5',
          color: 'Black'
        },
        photos: [] as string[],
        listing: {
          title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
          description: 'Open box Sony WH-1000XM5. Like new, fully functional with all accessories.',
          price: 249.99,
          category: 'Consumer Electronics > Portable Audio'
        }
      },
      {
        name: 'Samsung Galaxy S23 Ultra - 512GB',
        sku: 'S23U-512-BLK',
        condition: 'Mint',
        status: 'photos_completed' as const,
        listed: false,
        details: {
          brand: 'Samsung',
          model: 'Galaxy S23 Ultra',
          color: 'Phantom Black',
          storage: '512GB'
        },
        photos: [] as string[]
      },
      {
        name: 'iPad Air 5th Gen - 64GB - Blue',
        sku: 'IPAD5-64-BLU',
        condition: 'Fair',
        status: 'new' as const,
        listed: false,
        details: {
          brand: 'Apple',
          model: 'iPad Air 5',
          color: 'Blue',
          storage: '64GB'
        },
        photos: [] as string[]
      }
    ];

    for (const item of mockItems) {
      await storage.createInventoryItem(item as any);
    }
  } catch (error) {
    console.error('Seed error:', error);
    // Continue even if seeding fails
  }
}
