import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema } from "@shared/schema";
import { z } from "zod";

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
      
      // Validate that the body is partial
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

  return httpServer;
}
