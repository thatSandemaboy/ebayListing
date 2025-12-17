import React, { createContext, useContext, useState, ReactNode } from 'react';
import { InventoryItem, mockInventory, ItemStatus } from './mockData';

interface AppContextType {
  items: InventoryItem[];
  selectedItemId: string | null;
  selectedItem: InventoryItem | null;
  selectItem: (id: string) => void;
  updateItemStatus: (id: string, status: ItemStatus) => void;
  updateItemPhotos: (id: string, photos: string[]) => void;
  updateItemListing: (id: string, listing: any) => void;
  toggleItemListed: (id: string) => void;
  refreshInventory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = items.find(item => item.id === selectedItemId) || null;

  const selectItem = (id: string) => {
    setSelectedItemId(id);
  };

  const updateItemStatus = (id: string, status: ItemStatus) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const updateItemPhotos = (id: string, photos: string[]) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      // Auto-progress if enough photos are added (mock logic)
      let newStatus = item.status;
      if (photos.length > 0 && item.status === 'ready') {
        newStatus = 'in_progress';
      }
      
      return { ...item, photos, status: newStatus, lastUpdated: new Date().toISOString() };
    }));
  };

  const updateItemListing = (id: string, listing: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, listing, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const toggleItemListed = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, listed: !item.listed, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const refreshInventory = () => {
    // Simulate refresh
    const newItem: InventoryItem = {
      id: Math.random().toString(),
      name: 'Google Pixel 7 Pro - 128GB - Obsidian',
      sku: `PXL7P-128-${Math.floor(Math.random() * 1000)}`,
      condition: 'Good',
      status: 'ready',
      lastUpdated: new Date().toISOString(),
      details: {
        brand: 'Google',
        model: 'Pixel 7 Pro',
        color: 'Obsidian',
        storage: '128GB'
      },
      photos: []
    };
    setItems(prev => [newItem, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      items,
      selectedItemId,
      selectedItem,
      selectItem,
      updateItemStatus,
      updateItemPhotos,
      updateItemListing,
      toggleItemListed,
      refreshInventory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
