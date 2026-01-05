import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Inventory Items Table
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wholecellId: integer("wholecell_id").unique(), // Link to WholeCell
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  condition: text("condition").notNull(),
  status: text("status").notNull().default("new"), // 'new' | 'photos_completed' | 'listing_generated'
  listed: boolean("listed").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastUpdated: text("last_updated").notNull().default(sql`CURRENT_TIMESTAMP`),
  details: jsonb("details").notNull(), // { brand, model, color, storage, variant, network, esn, hexId, grade, conditions }
  photos: text("photos").array().notNull().default(sql`ARRAY[]::text[]`),
  listing: jsonb("listing"), // { title, description, price, category }
  salePrice: real("sale_price"), // Price in dollars
  totalPricePaid: real("total_price_paid").default(0),
  warehouse: text("warehouse"),
  location: text("location"),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems)
  .omit({ id: true, lastUpdated: true });

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Sync Metadata Table - tracks last sync timestamp
export const syncMetadata = pgTable("sync_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type SyncMetadata = typeof syncMetadata.$inferSelect;

// Photos Table - tracks individual photos linked to items
export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  url: text("url").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true, createdAt: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

// eBay Listings Table - stores complete eBay listing data
export const ebayListings = pgTable("ebay_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  status: text("status").notNull().default("draft"), // 'draft' | 'ready' | 'published'
  title: text("title").notNull(),
  categoryId: text("category_id"),
  categoryPath: text("category_path"), // e.g., "Electronics > Portable Audio & Headphones > Headphones"
  condition: text("condition").notNull(), // e.g., "For parts or not working"
  conditionNotes: text("condition_notes"),
  price: real("price"),
  descriptionHtml: text("description_html"), // Full HTML description
  whatsIncluded: text("whats_included"),
  productFeatures: text("product_features").array().default(sql`ARRAY[]::text[]`),
  shippingPolicy: text("shipping_policy"),
  returnPolicy: text("return_policy"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertEbayListingSchema = createInsertSchema(ebayListings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEbayListing = z.infer<typeof insertEbayListingSchema>;
export type EbayListing = typeof ebayListings.$inferSelect;

// eBay Item Specifics Table - stores key-value pairs for item specifics
export const ebayItemSpecifics = pgTable("ebay_item_specifics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => ebayListings.id, { onDelete: 'cascade' }),
  name: text("name").notNull(), // e.g., "Brand", "Model", "Color"
  value: text("value").notNull(), // e.g., "Bose", "QuietComfort", "Black"
  displayOrder: integer("display_order").default(0),
});

export const insertEbayItemSpecificSchema = createInsertSchema(ebayItemSpecifics).omit({ id: true });
export type InsertEbayItemSpecific = z.infer<typeof insertEbayItemSpecificSchema>;
export type EbayItemSpecific = typeof ebayItemSpecifics.$inferSelect;

// eBay OAuth Tokens Table - stores user's eBay authorization tokens
export const ebayTokens = pgTable("ebay_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: text("expires_at").notNull(),
  refreshExpiresAt: text("refresh_expires_at").notNull(),
  tokenType: text("token_type").notNull().default("Bearer"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type EbayToken = typeof ebayTokens.$inferSelect;

// Re-export chat models for AI integrations
export * from "./models/chat";
