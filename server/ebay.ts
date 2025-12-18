import { storage } from "./storage";

const EBAY_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.ebay.com' 
  : 'https://api.sandbox.ebay.com';

const EBAY_AUTH_BASE = process.env.NODE_ENV === 'production'
  ? 'https://auth.ebay.com'
  : 'https://auth.sandbox.ebay.com';

const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
].join(' ');

export function getRedirectUri(): string {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:5000';
  return `${baseUrl}/api/ebay/callback`;
}

export function getAuthorizationUrl(): string {
  const clientId = process.env.EBAY_CLIENT_ID;
  if (!clientId) {
    throw new Error('EBAY_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: EBAY_SCOPES,
    prompt: 'login',
  });

  return `${EBAY_AUTH_BASE}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('eBay credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('eBay token exchange failed:', error);
    throw new Error(`Failed to exchange code for tokens: ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    refreshExpiresIn: data.refresh_token_expires_in,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('eBay credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: EBAY_SCOPES,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('eBay token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function getValidAccessToken(): Promise<string> {
  const token = await storage.getEbayToken();
  if (!token) {
    throw new Error('Not connected to eBay. Please authorize first.');
  }

  const now = new Date();
  const expiresAt = new Date(token.expiresAt);
  const refreshExpiresAt = new Date(token.refreshExpiresAt);

  if (now >= refreshExpiresAt) {
    await storage.deleteEbayToken();
    throw new Error('eBay authorization has expired. Please re-authorize.');
  }

  if (now >= expiresAt) {
    console.log('Access token expired, refreshing...');
    const refreshed = await refreshAccessToken(token.refreshToken);
    const newExpiresAt = new Date(now.getTime() + refreshed.expiresIn * 1000);
    
    await storage.updateEbayToken({
      accessToken: refreshed.accessToken,
      expiresAt: newExpiresAt.toISOString(),
    });
    
    return refreshed.accessToken;
  }

  return token.accessToken;
}

export async function isConnectedToEbay(): Promise<boolean> {
  try {
    const token = await storage.getEbayToken();
    if (!token) return false;
    
    const refreshExpiresAt = new Date(token.refreshExpiresAt);
    return new Date() < refreshExpiresAt;
  } catch {
    return false;
  }
}

const ebayConditionMap: Record<string, string> = {
  'New': 'NEW',
  'Open box': 'NEW_OTHER',
  'Certified refurbished': 'MANUFACTURER_REFURBISHED',
  'Seller refurbished': 'SELLER_REFURBISHED',
  'Used': 'USED_EXCELLENT',
  'For parts or not working': 'FOR_PARTS_OR_NOT_WORKING',
};

function stripHtmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export async function createInventoryItem(
  sku: string,
  data: {
    title: string;
    description: string;
    condition: string;
    conditionDescription?: string;
    aspects: Record<string, string[]>;
    imageUrls: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  const accessToken = await getValidAccessToken();

  const plainTextDescription = stripHtmlToPlainText(data.description);

  const inventoryItem = {
    availability: {
      shipToLocationAvailability: {
        quantity: 1,
      },
    },
    condition: ebayConditionMap[data.condition] || 'USED_EXCELLENT',
    conditionDescription: data.conditionDescription,
    product: {
      title: data.title.substring(0, 80),
      description: plainTextDescription.substring(0, 4000),
      aspects: Object.keys(data.aspects).length > 0 ? data.aspects : undefined,
      imageUrls: data.imageUrls.length > 0 ? data.imageUrls : undefined,
    },
  };

  const response = await fetch(
    `${EBAY_API_BASE}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Language': 'en-US',
      },
      body: JSON.stringify(inventoryItem),
    }
  );

  if (response.status === 204 || response.status === 200) {
    return { success: true };
  }

  const error = await response.json();
  console.error('Failed to create inventory item:', error);
  return { success: false, error: error.errors?.[0]?.message || 'Failed to create inventory item' };
}

export async function createOffer(
  sku: string,
  data: {
    price: number;
    categoryId: string;
    listingDescription?: string;
    merchantLocationKey?: string;
    fulfillmentPolicyId?: string;
    paymentPolicyId?: string;
    returnPolicyId?: string;
  }
): Promise<{ success: boolean; offerId?: string; error?: string }> {
  const accessToken = await getValidAccessToken();

  const offer: Record<string, any> = {
    sku,
    marketplaceId: 'EBAY_US',
    format: 'FIXED_PRICE',
    availableQuantity: 1,
    pricingSummary: {
      price: {
        value: data.price.toFixed(2),
        currency: 'USD',
      },
    },
    categoryId: data.categoryId || '9355',
  };

  if (data.listingDescription) {
    const plainTextDescription = stripHtmlToPlainText(data.listingDescription).substring(0, 4000);
    if (plainTextDescription) {
      offer.listingDescription = plainTextDescription;
    }
  }

  if (data.merchantLocationKey) {
    offer.merchantLocationKey = data.merchantLocationKey;
  }

  if (data.fulfillmentPolicyId || data.paymentPolicyId || data.returnPolicyId) {
    offer.listingPolicies = {};
    if (data.fulfillmentPolicyId) offer.listingPolicies.fulfillmentPolicyId = data.fulfillmentPolicyId;
    if (data.paymentPolicyId) offer.listingPolicies.paymentPolicyId = data.paymentPolicyId;
    if (data.returnPolicyId) offer.listingPolicies.returnPolicyId = data.returnPolicyId;
  }

  const response = await fetch(`${EBAY_API_BASE}/sell/inventory/v1/offer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Language': 'en-US',
    },
    body: JSON.stringify(offer),
  });

  if (response.status === 201) {
    const result = await response.json();
    return { success: true, offerId: result.offerId };
  }

  const error = await response.json();
  console.error('Failed to create offer:', error);
  return { success: false, error: error.errors?.[0]?.message || 'Failed to create offer' };
}

export async function publishOffer(offerId: string): Promise<{ success: boolean; listingId?: string; error?: string }> {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${EBAY_API_BASE}/sell/inventory/v1/offer/${offerId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const result = await response.json();
    return { success: true, listingId: result.listingId };
  }

  const error = await response.json();
  console.error('Failed to publish offer:', error);
  return { success: false, error: error.errors?.[0]?.message || 'Failed to publish listing' };
}

export async function getInventoryLocations(): Promise<Array<{ merchantLocationKey: string; name: string }>> {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${EBAY_API_BASE}/sell/inventory/v1/location`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error('Failed to get inventory locations:', await response.text());
    return [];
  }

  const data = await response.json();
  return (data.locations || []).map((loc: any) => ({
    merchantLocationKey: loc.merchantLocationKey,
    name: loc.name || loc.merchantLocationKey,
  }));
}

export async function getBusinessPolicies(): Promise<{
  fulfillmentPolicies: Array<{ id: string; name: string }>;
  paymentPolicies: Array<{ id: string; name: string }>;
  returnPolicies: Array<{ id: string; name: string }>;
}> {
  const accessToken = await getValidAccessToken();

  const [fulfillmentRes, paymentRes, returnRes] = await Promise.all([
    fetch(`${EBAY_API_BASE}/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }),
    fetch(`${EBAY_API_BASE}/sell/account/v1/payment_policy?marketplace_id=EBAY_US`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }),
    fetch(`${EBAY_API_BASE}/sell/account/v1/return_policy?marketplace_id=EBAY_US`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }),
  ]);

  const extractPolicies = async (res: Response) => {
    if (!res.ok) return [];
    const data = await res.json();
    return (data.fulfillmentPolicies || data.paymentPolicies || data.returnPolicies || []).map((p: any) => ({
      id: p.fulfillmentPolicyId || p.paymentPolicyId || p.returnPolicyId,
      name: p.name,
    }));
  };

  return {
    fulfillmentPolicies: await extractPolicies(fulfillmentRes),
    paymentPolicies: await extractPolicies(paymentRes),
    returnPolicies: await extractPolicies(returnRes),
  };
}
