import { storage } from "./storage";
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
        wholecell_id integer UNIQUE,
        name text NOT NULL,
        sku text NOT NULL,
        condition text NOT NULL,
        status text NOT NULL DEFAULT 'new',
        listed boolean NOT NULL DEFAULT false,
        created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_updated text NOT NULL DEFAULT CURRENT_TIMESTAMP,
        details jsonb NOT NULL,
        photos text[] NOT NULL DEFAULT ARRAY[]::text[],
        listing jsonb,
        sale_price real,
        total_price_paid real DEFAULT 0,
        warehouse text,
        location text
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    await db.execute(sql`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS wholecell_id integer UNIQUE;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS sale_price real;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS total_price_paid real DEFAULT 0;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS warehouse text;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location text;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Seed error:', error);
  }
}
