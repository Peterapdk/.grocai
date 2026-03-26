
import React from 'react';
import { 
  Leaf, 
  Milk, 
  Croissant, 
  Flame, 
  IceCream, 
  Package, 
  Coffee, 
  Sparkles, 
  ShoppingBag 
} from 'lucide-react';

export const CATEGORY_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  'Grønt & Frugt': { color: '#22c55e', icon: <Leaf className="w-4 h-4" /> },
  'Mejeri & Æg': { color: '#3b82f6', icon: <Milk className="w-4 h-4" /> },
  'Bageri & Brød': { color: '#f59e0b', icon: <Croissant className="w-4 h-4" /> },
  'Kød & Fisk': { color: '#ef4444', icon: <Flame className="w-4 h-4" /> },
  'Frost & Dybfrost': { color: '#06b6d4', icon: <IceCream className="w-4 h-4" /> },
  'Kolonial & Korn': { color: '#8b5cf6', icon: <Package className="w-4 h-4" /> },
  'Drikkevarer': { color: '#ec4899', icon: <Coffee className="w-4 h-4" /> },
  'Husholdning': { color: '#6366f1', icon: <Sparkles className="w-4 h-4" /> },
  'Andet': { color: '#71717a', icon: <ShoppingBag className="w-4 h-4" /> },
};

const CATEGORY_MAP_STRING = Object.entries(CATEGORY_STYLES)
  .map(([name, style]) => `- ${name}: ${style.color}`)
  .join('\n');

export const INITIAL_PROMPT = `Du er en professionel ekspert i kategorisering af dagligvarer. Din opgave er at kategorisere en vare i en af de foruddefinerede kategorier og give en matchende farve og emoji.

Obligatoriske Regler:
1. Kategori: Skal være præcis én af følgende strenge: ${Object.keys(CATEGORY_STYLES).join(', ')}.
2. Farve: Skal være den specifikke hex-kode tilknyttet den valgte kategori:
${CATEGORY_MAP_STRING}
3. Emoji: Skal være en enkelt, relevant emoji.
4. Svar: Returner strengt gyldig JSON.

Vare der skal kategoriseres: `;
