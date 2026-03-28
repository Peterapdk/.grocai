import { withTimeout } from "../lib/timeout";

/**
 * Open Food Facts integration (Great free fallback source)
 */
export async function lookupOpenFoodFacts(barcode: string) {
  return withTimeout(
    (async () => {
      try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status === 1) {
          return {
            name: data.product.product_name,
            brand: data.product.brands,
            imageUrl: data.product.image_front_small_url
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    })(),
    5000, // 5 second timeout for Open Food Facts
    null
  );
}
