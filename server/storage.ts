import { type User, type InsertUser, type InventoryItem, type InsertInventoryItem, type SyncMetadata, type Photo, type InsertPhoto, type EbayListing, type InsertEbayListing, type EbayItemSpecific, type InsertEbayItemSpecific, type EbayToken } from "@shared/schema";
import { users, inventoryItems, syncMetadata, photos, ebayListings, ebayItemSpecifics, ebayTokens } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getInventoryItemByWholecellId(wholecellId: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  upsertByWholecellId(wholecellId: number, item: Omit<InsertInventoryItem, 'wholecellId'>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<void>;
  
  // Photo operations
  getPhotosByItemId(itemId: string): Promise<Photo[]>;
  addPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: string): Promise<void>;
  deletePhotosByItemId(itemId: string): Promise<void>;
  
  // eBay listing operations
  getEbayListingByItemId(itemId: string): Promise<EbayListing | undefined>;
  getEbayListing(id: string): Promise<EbayListing | undefined>;
  createEbayListing(listing: InsertEbayListing): Promise<EbayListing>;
  updateEbayListing(id: string, listing: Partial<InsertEbayListing>): Promise<EbayListing | undefined>;
  deleteEbayListing(id: string): Promise<void>;
  
  // eBay item specifics operations
  getItemSpecificsByListingId(listingId: string): Promise<EbayItemSpecific[]>;
  setItemSpecifics(listingId: string, specifics: Omit<InsertEbayItemSpecific, 'listingId'>[]): Promise<EbayItemSpecific[]>;
  deleteItemSpecificsByListingId(listingId: string): Promise<void>;
  
  // eBay token operations
  getEbayToken(): Promise<EbayToken | undefined>;
  saveEbayToken(token: { accessToken: string; refreshToken: string; expiresAt: string; refreshExpiresAt: string }): Promise<EbayToken>;
  updateEbayToken(updates: Partial<Pick<EbayToken, 'accessToken' | 'expiresAt'>>): Promise<void>;
  deleteEbayToken(): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    const result = await db.select().from(inventoryItems);
    return result;
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return result[0];
  }

  async getInventoryItemByWholecellId(wholecellId: number): Promise<InventoryItem | undefined> {
    const result = await db.select().from(inventoryItems).where(eq(inventoryItems.wholecellId, wholecellId));
    return result[0];
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const result = await db.insert(inventoryItems).values(item).returning();
    return result[0];
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const updated = {
      ...item,
      lastUpdated: new Date().toISOString(),
    };
    const result = await db
      .update(inventoryItems)
      .set(updated)
      .where(eq(inventoryItems.id, id))
      .returning();
    return result[0];
  }

  async upsertByWholecellId(wholecellId: number, item: Omit<InsertInventoryItem, 'wholecellId'>): Promise<InventoryItem> {
    const existing = await this.getInventoryItemByWholecellId(wholecellId);
    
    if (existing) {
      // Update existing item
      const result = await db
        .update(inventoryItems)
        .set({
          ...item,
          lastUpdated: new Date().toISOString(),
        })
        .where(eq(inventoryItems.wholecellId, wholecellId))
        .returning();
      return result[0];
    } else {
      // Create new item
      const result = await db
        .insert(inventoryItems)
        .values({
          ...item,
          wholecellId,
        })
        .returning();
      return result[0];
    }
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  async getSyncMetadata(key: string): Promise<string | null> {
    const result = await db.select().from(syncMetadata).where(eq(syncMetadata.key, key));
    return result[0]?.value || null;
  }

  async setSyncMetadata(key: string, value: string): Promise<void> {
    const existing = await db.select().from(syncMetadata).where(eq(syncMetadata.key, key));
    if (existing.length > 0) {
      await db.update(syncMetadata)
        .set({ value, updatedAt: new Date().toISOString() })
        .where(eq(syncMetadata.key, key));
    } else {
      await db.insert(syncMetadata).values({ key, value });
    }
  }

  // Photo operations
  async getPhotosByItemId(itemId: string): Promise<Photo[]> {
    const result = await db.select().from(photos).where(eq(photos.itemId, itemId));
    return result;
  }

  async addPhoto(photo: InsertPhoto): Promise<Photo> {
    const result = await db.insert(photos).values(photo).returning();
    return result[0];
  }

  async deletePhoto(id: string): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  async deletePhotosByItemId(itemId: string): Promise<void> {
    await db.delete(photos).where(eq(photos.itemId, itemId));
  }

  // eBay listing operations
  async getEbayListingByItemId(itemId: string): Promise<EbayListing | undefined> {
    const result = await db.select().from(ebayListings).where(eq(ebayListings.itemId, itemId));
    return result[0];
  }

  async getEbayListing(id: string): Promise<EbayListing | undefined> {
    const result = await db.select().from(ebayListings).where(eq(ebayListings.id, id));
    return result[0];
  }

  async createEbayListing(listing: InsertEbayListing): Promise<EbayListing> {
    const result = await db.insert(ebayListings).values(listing).returning();
    return result[0];
  }

  async updateEbayListing(id: string, listing: Partial<InsertEbayListing>): Promise<EbayListing | undefined> {
    const updated = {
      ...listing,
      updatedAt: new Date().toISOString(),
    };
    const result = await db
      .update(ebayListings)
      .set(updated)
      .where(eq(ebayListings.id, id))
      .returning();
    return result[0];
  }

  async deleteEbayListing(id: string): Promise<void> {
    await db.delete(ebayListings).where(eq(ebayListings.id, id));
  }

  // eBay item specifics operations
  async getItemSpecificsByListingId(listingId: string): Promise<EbayItemSpecific[]> {
    const result = await db
      .select()
      .from(ebayItemSpecifics)
      .where(eq(ebayItemSpecifics.listingId, listingId));
    return result;
  }

  async setItemSpecifics(listingId: string, specifics: Omit<InsertEbayItemSpecific, 'listingId'>[]): Promise<EbayItemSpecific[]> {
    // Delete existing specifics first
    await db.delete(ebayItemSpecifics).where(eq(ebayItemSpecifics.listingId, listingId));
    
    if (specifics.length === 0) return [];
    
    // Insert new specifics
    const toInsert = specifics.map((s, index) => ({
      ...s,
      listingId,
      displayOrder: s.displayOrder ?? index,
    }));
    
    const result = await db.insert(ebayItemSpecifics).values(toInsert).returning();
    return result;
  }

  async deleteItemSpecificsByListingId(listingId: string): Promise<void> {
    await db.delete(ebayItemSpecifics).where(eq(ebayItemSpecifics.listingId, listingId));
  }

  // eBay token operations (single token for the app)
  async getEbayToken(): Promise<EbayToken | undefined> {
    const result = await db.select().from(ebayTokens).limit(1);
    return result[0];
  }

  async saveEbayToken(token: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    refreshExpiresAt: string;
  }): Promise<EbayToken> {
    // Delete any existing tokens first (we only store one)
    await db.delete(ebayTokens);
    
    const result = await db.insert(ebayTokens).values({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      refreshExpiresAt: token.refreshExpiresAt,
      tokenType: 'Bearer',
    }).returning();
    return result[0];
  }

  async updateEbayToken(updates: Partial<Pick<EbayToken, 'accessToken' | 'expiresAt'>>): Promise<void> {
    const token = await this.getEbayToken();
    if (!token) return;
    
    await db.update(ebayTokens)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(ebayTokens.id, token.id));
  }

  async deleteEbayToken(): Promise<void> {
    await db.delete(ebayTokens);
  }
}

export const storage = new DbStorage();
