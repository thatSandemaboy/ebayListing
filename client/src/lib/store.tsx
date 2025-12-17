import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryItem, ItemStatus } from './mockData';

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
  isLoading: boolean;
  error: Error | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  const res = await fetch('/api/inventory');
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
};

const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
  const res = await fetch(`/api/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update inventory item');
  return res.json();
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventoryItems,
  });

  const selectedItem = items.find(item => item.id === selectedItemId) || null;

  const selectItem = (id: string) => {
    setSelectedItemId(id);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateInventoryItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const updateItemStatus = (id: string, status: ItemStatus) => {
    updateMutation.mutate({ id, updates: { status } });
  };

  const updateItemPhotos = (id: string, photos: string[]) => {
    let newStatus = items.find(i => i.id === id)?.status;
    if (photos.length > 0 && newStatus === 'new') {
      newStatus = 'photos_completed';
    }
    updateMutation.mutate({ id, updates: { photos, status: newStatus } });
  };

  const updateItemListing = (id: string, listing: any) => {
    updateMutation.mutate({ id, updates: { listing } });
  };

  const toggleItemListed = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      updateMutation.mutate({ id, updates: { listed: !item.listed } });
    }
  };

  const refreshInventory = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
      refreshInventory,
      isLoading,
      error: error as Error | null,
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
