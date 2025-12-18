export type ItemStatus = 'new' | 'photos_completed' | 'listing_generated';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  condition: string;
  status: ItemStatus;
  listed: boolean;
  lastUpdated: string;
  details: {
    brand: string;
    model: string;
    color: string;
    storage?: string;
    processor?: string;
    ram?: string;
    variant?: string;
    network?: string;
  };
  photos: string[];
  listing?: {
    title: string;
    description: string;
    price: number;
    category: string;
  };
  salePrice?: number;
  totalPricePaid?: number;
  warehouse?: string;
  location?: string;
  wholecellId?: number;
  createdAt?: string;
}
