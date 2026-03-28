
export interface PriceSource {
  store: string;
  price: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
  quantity: number;
  price?: number;
  priceSources?: PriceSource[];
  isEstimating?: boolean;
  barcode?: string;
  brand?: string;
  imageUrl?: string;
  addedAt: number;
  completed: boolean;
  isFavorite?: boolean;
}

export interface FavoriteItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
  price?: number;
  addedAt: number;
}

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
  quantity: number;
  addedAt: number;
  expirationDate?: number;
  percentageLeft?: number;
  isFavorite?: boolean;
  brand?: string;
  imageUrl?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: number;
  ownerId?: string;
  ownerEmail?: string;
  members?: string[];
}

export interface CategoryGroup {
  name: string;
  color: string;
  items: GroceryItem[];
}

export enum GroceryCategory {
  PRODUCE = 'Grønt & Frugt',
  DAIRY = 'Mejeri & Æg',
  BAKERY = 'Bageri & Brød',
  MEAT = 'Kød & Fisk',
  FROZEN = 'Frost & Dybfrost',
  PANTRY = 'Kolonial & Korn',
  BEVERAGES = 'Drikkevarer',
  HOUSEHOLD = 'Husholdning',
  OTHER = 'Andet'
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
