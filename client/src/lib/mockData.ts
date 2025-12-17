import iPhoneImg from '@assets/generated_images/product_image_iphone.png';
import laptopImg from '@assets/generated_images/product_image_laptop.png';
import headphonesImg from '@assets/generated_images/product_image_headphones.png';

export type ItemStatus = 'ready' | 'in_progress' | 'completed';

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
  };
  photos: string[];
  listing?: {
    title: string;
    description: string;
    price: number;
    category: string;
  };
}

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Apple iPhone 14 Pro - 256GB - Graphite',
    sku: 'IP14P-256-GR',
    condition: 'Excellent',
    status: 'ready',
    listed: true,
    lastUpdated: '2023-10-24T10:30:00Z',
    details: {
      brand: 'Apple',
      model: 'iPhone 14 Pro',
      color: 'Graphite',
      storage: '256GB'
    },
    photos: [iPhoneImg],
  },
  {
    id: '2',
    name: 'MacBook Pro 14" M1 Pro - 16GB/512GB',
    sku: 'MBP14-M1-16-512',
    condition: 'Good',
    status: 'in_progress',
    listed: true,
    lastUpdated: '2023-10-23T15:45:00Z',
    details: {
      brand: 'Apple',
      model: 'MacBook Pro',
      color: 'Silver',
      processor: 'M1 Pro',
      ram: '16GB',
      storage: '512GB'
    },
    photos: [laptopImg],
    listing: {
      title: 'Apple MacBook Pro 14" Laptop M1 Pro Chip 16GB RAM 512GB SSD Silver - Good Condition',
      description: 'Up for sale is a MacBook Pro 14-inch with M1 Pro chip. The device is in good condition with minor signs of wear on the chassis. Screen is flawless. Battery health is at 92%. Includes original charger.',
      price: 1299.00,
      category: 'Computers/Tablets & Networking > Laptops & Netbooks > Apple Laptops'
    }
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    sku: 'SNY-XM5-BLK',
    condition: 'Open Box',
    status: 'completed',
    listed: true,
    lastUpdated: '2023-10-22T09:15:00Z',
    details: {
      brand: 'Sony',
      model: 'WH-1000XM5',
      color: 'Black'
    },
    photos: [headphonesImg],
    listing: {
      title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones - Black - Open Box',
      description: 'Like new open box Sony WH-1000XM5 headphones. Tested and fully functional. Comes with all original accessories and packaging.',
      price: 249.99,
      category: 'Consumer Electronics > Portable Audio & Headphones > Headphones'
    }
  },
  {
    id: '4',
    name: 'Samsung Galaxy S23 Ultra - 512GB',
    sku: 'S23U-512-BLK',
    condition: 'Mint',
    status: 'ready',
    listed: false,
    lastUpdated: '2023-10-25T11:00:00Z',
    details: {
      brand: 'Samsung',
      model: 'Galaxy S23 Ultra',
      color: 'Phantom Black',
      storage: '512GB'
    },
    photos: [],
  },
  {
    id: '5',
    name: 'iPad Air 5th Gen - 64GB - Blue',
    sku: 'IPAD5-64-BLU',
    condition: 'Fair',
    status: 'ready',
    listed: false,
    lastUpdated: '2023-10-21T14:20:00Z',
    details: {
      brand: 'Apple',
      model: 'iPad Air 5',
      color: 'Blue',
      storage: '64GB'
    },
    photos: [],
  }
];
