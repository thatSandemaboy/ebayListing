const BASE_URL = 'https://api.wholecell.io/api/v1';

interface WholeCellConfig {
  appKey: string;
  appSecret: string;
}

function getConfig(): WholeCellConfig {
  const appKey = process.env.WHOLECELL_APP_KEY;
  const appSecret = process.env.WHOLECELL_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error('WholeCell API credentials not configured. Please set WHOLECELL_APP_KEY and WHOLECELL_APP_SECRET.');
  }

  return { appKey, appSecret };
}

function getAuthHeaders(): HeadersInit {
  const { appKey, appSecret } = getConfig();
  const credentials = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
  
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

export interface WholeCellProduct {
  id: number;
  manufacturer: string;
  model: string;
  variant: string;
  network: string;
  capacity: string;
  color: string;
}

export interface WholeCellProductVariation {
  id: number;
  sku: string;
  product: WholeCellProduct;
  grade: string;
  conditions: Array<{ id: number; title: string; initials: string }>;
}

export interface WholeCellInventoryItem {
  id: number;
  esn: string;
  status: string;
  order_id: number | null;
  hex_id: string;
  sale_price: number | null;
  total_price_paid: number;
  initial_price_paid: number | null;
  created_at: string;
  updated_at: string;
  purchase_order_id: number;
  product_variation: WholeCellProductVariation;
  warehouse: { name: string | null };
  location: { name: string | null };
}

export interface WholeCellInventoryResponse {
  data: WholeCellInventoryItem[];
  page: number;
  pages: number;
}

export interface WholeCellPhoto {
  id: number;
  url: string;
  thumbnail_url?: string;
}

export interface WholeCellPhotosResponse {
  photos: WholeCellPhoto[];
}

export async function fetchInventories(page: number = 1, status?: string): Promise<WholeCellInventoryResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  if (status) {
    params.set('status', status);
  }
  
  const response = await fetch(`${BASE_URL}/inventories?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WholeCell API error: ${response.status} - ${text}`);
  }

  return response.json();
}

export async function fetchAllInventories(status: string = 'Needs eBay Draft'): Promise<WholeCellInventoryItem[]> {
  const allItems: WholeCellInventoryItem[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await fetchInventories(currentPage, status);
    allItems.push(...response.data);
    totalPages = response.pages;
    currentPage++;
    
    // Rate limiting: wait 500ms between requests to stay under 2 req/sec limit
    if (currentPage <= totalPages) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } while (currentPage <= totalPages);

  return allItems;
}

export async function fetchPhotos(inventoryId: number): Promise<WholeCellPhoto[]> {
  const response = await fetch(`${BASE_URL}/inventories/${inventoryId}/photos`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    const text = await response.text();
    throw new Error(`WholeCell API error: ${response.status} - ${text}`);
  }

  const data: WholeCellPhotosResponse = await response.json();
  return data.photos || [];
}

export function mapWholeCellToInventoryItem(wcItem: WholeCellInventoryItem) {
  const product = wcItem.product_variation?.product;
  const variation = wcItem.product_variation;
  
  // Build name from product info
  const nameParts = [
    product?.manufacturer,
    product?.model,
    product?.capacity,
    product?.color
  ].filter(Boolean);
  
  const name = nameParts.length > 0 ? nameParts.join(' - ') : `Item ${wcItem.hex_id}`;
  
  // Map grade to condition
  const condition = variation?.grade || 'Unknown';
  
  // Map status - WholeCell uses different status names
  let status: 'new' | 'photos_completed' | 'listing_generated' = 'new';
  if (wcItem.status) {
    const lowerStatus = wcItem.status.toLowerCase();
    if (lowerStatus.includes('listed') || lowerStatus.includes('sold')) {
      status = 'listing_generated';
    } else if (lowerStatus.includes('ready') || lowerStatus.includes('processed')) {
      status = 'photos_completed';
    }
  }
  
  return {
    wholecellId: wcItem.id,
    name,
    sku: variation?.sku || wcItem.hex_id,
    condition,
    status,
    listed: wcItem.order_id !== null,
    lastUpdated: wcItem.updated_at,
    details: {
      brand: product?.manufacturer || '',
      model: product?.model || '',
      color: product?.color || '',
      storage: product?.capacity || '',
      variant: product?.variant || '',
      network: product?.network || '',
      esn: wcItem.esn || '',
      hexId: wcItem.hex_id,
      grade: variation?.grade || '',
      conditions: variation?.conditions?.map(c => c.title) || [],
    },
    salePrice: wcItem.sale_price ? wcItem.sale_price / 100 : null, // Convert cents to dollars
    totalPricePaid: wcItem.total_price_paid ? wcItem.total_price_paid / 100 : 0,
    warehouse: wcItem.warehouse?.name || null,
    location: wcItem.location?.name || null,
  };
}
