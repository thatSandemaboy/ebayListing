import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertPhotoSchema, insertEbayListingSchema, insertEbayItemSpecificSchema } from "@shared/schema";
import { z } from "zod";
import { fetchAllInventories, mapWholeCellToInventoryItem } from "./wholecell";
import { getAuthorizationUrl, exchangeCodeForTokens, isConnectedToEbay, createInventoryItem, createOffer, getBusinessPolicies, getInventoryLocations, getRedirectUri } from "./ebay";
import { registerImageRoutes } from "./replit_integrations/image";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Inventory Routes
  app.get("/api/inventory", async (req, res, next) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/inventory/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await storage.getInventoryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/inventory", async (req, res, next) => {
    try {
      const body = req.body;
      const validated = insertInventoryItemSchema.parse(body);
      const item = await storage.createInventoryItem(validated);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/inventory/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      
      const partialSchema = insertInventoryItemSchema.partial();
      const validated = partialSchema.parse(body);
      
      const item = await storage.updateInventoryItem(id, validated);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/inventory/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteInventoryItem(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // WholeCell Sync Endpoint with SSE progress
  app.post("/api/sync", async (req, res, next) => {
    try {
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const sendProgress = (progress: number, synced: number, total: number) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', progress, synced, total })}\n\n`);
        // Force flush to ensure client receives updates
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      console.log('Starting WholeCell sync...');
      
      // Get last sync timestamp
      const lastSyncTimestamp = await storage.getSyncMetadata('wholecell_last_sync');
      const syncStartTime = new Date().toISOString();
      
      if (lastSyncTimestamp) {
        console.log(`Last sync was at: ${lastSyncTimestamp}`);
      } else {
        console.log('First sync - fetching all items');
      }
      
      // Fetch inventories updated since last sync (or all if first sync)
      const wholecellItems = await fetchAllInventories('Needs eBay Draft', lastSyncTimestamp || undefined);
      console.log(`Fetched ${wholecellItems.length} items from WholeCell${lastSyncTimestamp ? ' (updated since last sync)' : ''}`);
      
      const total = wholecellItems.length;
      let synced = 0;
      let errors = 0;
      
      // Handle empty result case
      if (total === 0) {
        // Still update sync timestamp even if no new items
        await storage.setSyncMetadata('wholecell_last_sync', syncStartTime);
        sendProgress(100, 0, 0);
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          success: true, 
          synced: 0, 
          errors: 0, 
          total: 0,
          message: lastSyncTimestamp ? 'No new updates since last sync' : 'No items to sync'
        })}\n\n`);
        res.end();
        return;
      }
      
      // Send initial progress
      sendProgress(0, 0, total);
      
      for (const wcItem of wholecellItems) {
        try {
          const mapped = mapWholeCellToInventoryItem(wcItem);
          
          // Upsert the item (photos managed separately, not from WholeCell)
          await storage.upsertByWholecellId(mapped.wholecellId, {
            name: mapped.name,
            sku: mapped.sku,
            condition: mapped.condition,
            status: mapped.status,
            listed: mapped.listed,
            createdAt: mapped.createdAt,
            details: mapped.details,
            photos: [],
            salePrice: mapped.salePrice,
            totalPricePaid: mapped.totalPricePaid,
            warehouse: mapped.warehouse,
            location: mapped.location,
          });
          
          synced++;
        } catch (itemError) {
          console.error(`Failed to sync item ${wcItem.id}:`, itemError);
          errors++;
        }
        
        // Send progress update
        const progress = Math.round(((synced + errors) / total) * 100);
        sendProgress(progress, synced, total);
        
        // Small delay every 10 items to allow progress bar to render
        if ((synced + errors) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log(`Sync complete: ${synced} synced, ${errors} errors`);
      
      // Only save the sync timestamp if there were no errors
      // This ensures failed items will be retried on next sync
      if (errors === 0) {
        await storage.setSyncMetadata('wholecell_last_sync', syncStartTime);
      } else {
        console.log(`Skipping timestamp update due to ${errors} errors - failed items will be retried`);
      }
      
      // Send completion event
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        success: true, 
        synced, 
        errors, 
        total 
      })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Sync error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: String(error) })}\n\n`);
      res.end();
    }
  });

  // Get sync status / test connection
  app.get("/api/sync/status", async (req, res, next) => {
    try {
      // Try to fetch just one page to test connection
      const response = await fetch('https://api.wholecell.io/api/v1/inventories?page=1', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.WHOLECELL_APP_KEY}:${process.env.WHOLECELL_APP_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        res.json({
          connected: true,
          totalItems: data.data?.length || 0,
          totalPages: data.pages || 1,
        });
      } else {
        res.json({
          connected: false,
          error: `API returned ${response.status}`,
        });
      }
    } catch (error: any) {
      res.json({
        connected: false,
        error: error.message,
      });
    }
  });

  // Photo Routes
  app.get("/api/items/:itemId/photos", async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const photos = await storage.getPhotosByItemId(itemId);
      res.json(photos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/items/:itemId/photos", async (req, res, next) => {
    try {
      const { itemId } = req.params;
      
      // Validate the item exists
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Validate request body
      const validated = insertPhotoSchema.parse({ itemId, url: req.body.url });
      
      const photo = await storage.addPhoto(validated);
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/photos/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deletePhoto(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // eBay Listing Routes
  app.get("/api/items/:itemId/ebay-listing", async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const listing = await storage.getEbayListingByItemId(itemId);
      if (!listing) {
        return res.status(404).json({ message: "No eBay listing found for this item" });
      }
      
      // Also fetch item specifics
      const specifics = await storage.getItemSpecificsByListingId(listing.id);
      res.json({ ...listing, itemSpecifics: specifics });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/items/:itemId/ebay-listing", async (req, res, next) => {
    try {
      const { itemId } = req.params;
      
      // Validate the item exists
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Check if listing already exists
      const existing = await storage.getEbayListingByItemId(itemId);
      if (existing) {
        return res.status(409).json({ message: "eBay listing already exists for this item", listingId: existing.id });
      }
      
      const { itemSpecifics, ...listingData } = req.body;
      const validated = insertEbayListingSchema.parse({ ...listingData, itemId });
      
      const listing = await storage.createEbayListing(validated);
      
      // Save item specifics if provided
      if (itemSpecifics && Array.isArray(itemSpecifics)) {
        await storage.setItemSpecifics(listing.id, itemSpecifics);
      }
      
      const specifics = await storage.getItemSpecificsByListingId(listing.id);
      res.status(201).json({ ...listing, itemSpecifics: specifics });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/ebay-listings/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { itemSpecifics, ...listingData } = req.body;
      
      const partialSchema = insertEbayListingSchema.partial();
      const validated = partialSchema.parse(listingData);
      
      const listing = await storage.updateEbayListing(id, validated);
      if (!listing) {
        return res.status(404).json({ message: "eBay listing not found" });
      }
      
      // Update item specifics if provided
      if (itemSpecifics && Array.isArray(itemSpecifics)) {
        await storage.setItemSpecifics(id, itemSpecifics);
      }
      
      const specifics = await storage.getItemSpecificsByListingId(id);
      res.json({ ...listing, itemSpecifics: specifics });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/ebay-listings/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteEbayListing(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // eBay OAuth Routes
  app.get("/api/ebay/status", async (req, res, next) => {
    try {
      const connected = await isConnectedToEbay();
      const hasCredentials = !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
      res.json({ connected, hasCredentials, redirectUri: getRedirectUri() });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/ebay/auth", async (req, res, next) => {
    try {
      const authUrl = getAuthorizationUrl();
      res.json({ authUrl });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/ebay/callback", async (req, res, next) => {
    try {
      const { code, error: authError } = req.query;
      
      if (authError) {
        console.error('eBay auth error:', authError);
        return res.redirect('/?ebay_error=auth_denied');
      }
      
      if (!code || typeof code !== 'string') {
        return res.redirect('/?ebay_error=no_code');
      }
      
      const tokens = await exchangeCodeForTokens(code);
      const now = new Date();
      
      await storage.saveEbayToken({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(now.getTime() + tokens.expiresIn * 1000).toISOString(),
        refreshExpiresAt: new Date(now.getTime() + tokens.refreshExpiresIn * 1000).toISOString(),
      });
      
      res.redirect('/?ebay_connected=true');
    } catch (error: any) {
      console.error('eBay callback error:', error);
      res.redirect('/?ebay_error=token_exchange_failed');
    }
  });

  app.post("/api/ebay/disconnect", async (req, res, next) => {
    try {
      await storage.deleteEbayToken();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/ebay/policies", async (req, res, next) => {
    try {
      const policies = await getBusinessPolicies();
      res.json(policies);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/ebay/locations", async (req, res, next) => {
    try {
      const locations = await getInventoryLocations();
      res.json({ locations });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Push listing to eBay
  app.post("/api/ebay/push/:itemId", async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const { categoryId, merchantLocationKey, fulfillmentPolicyId, paymentPolicyId, returnPolicyId } = req.body;
      
      const item = await storage.getInventoryItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const listing = await storage.getEbayListingByItemId(itemId);
      if (!listing) {
        return res.status(400).json({ message: "No eBay listing found for this item. Please generate a listing first." });
      }
      
      const photos = await storage.getPhotosByItemId(itemId);
      const specifics = await storage.getItemSpecificsByListingId(listing.id);
      
      // Convert item specifics to eBay aspects format
      const aspects: Record<string, string[]> = {};
      for (const s of specifics) {
        if (s.name && s.value) {
          aspects[s.name] = [s.value];
        }
      }
      
      // Step 1: Create inventory item on eBay
      const inventoryResult = await createInventoryItem(item.sku, {
        title: listing.title,
        description: listing.descriptionHtml || '',
        condition: listing.condition,
        conditionDescription: listing.conditionNotes || undefined,
        aspects,
        imageUrls: photos.map(p => p.url),
      });
      
      if (!inventoryResult.success) {
        return res.status(400).json({ 
          message: `Failed to create inventory item: ${inventoryResult.error}`,
          step: 'inventory_item'
        });
      }
      
      // Get merchant location key if not provided
      let locationKey = merchantLocationKey;
      if (!locationKey) {
        const locations = await getInventoryLocations();
        if (locations.length > 0) {
          locationKey = locations[0].merchantLocationKey;
        } else {
          return res.status(400).json({ 
            message: 'No inventory locations configured in your eBay account. Please create a business location in eBay Seller Hub before pushing listings.',
            step: 'location_required'
          });
        }
      }
      
      // Step 2: Create offer (draft listing)
      const offerResult = await createOffer(item.sku, {
        price: listing.price || 0,
        categoryId: categoryId || listing.categoryId || '',
        listingDescription: listing.descriptionHtml || undefined,
        merchantLocationKey: locationKey,
        fulfillmentPolicyId,
        paymentPolicyId,
        returnPolicyId,
      });
      
      if (!offerResult.success) {
        return res.status(400).json({ 
          message: `Failed to create offer: ${offerResult.error}`,
          step: 'offer'
        });
      }
      
      // Update listing status
      await storage.updateEbayListing(listing.id, { status: 'ready' });
      
      res.json({ 
        success: true, 
        offerId: offerResult.offerId,
        message: 'Listing created on eBay as a draft. You can publish it from your eBay Seller Hub.'
      });
    } catch (error: any) {
      console.error('Push to eBay error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Register AI image generation routes
  registerImageRoutes(app);

  return httpServer;
}
