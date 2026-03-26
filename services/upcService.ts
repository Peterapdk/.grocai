/**
 * Service for Go-UPC integration
 * Docs: https://go-upc.com/docs
 */

export interface GoUPCResponse {
  code: string;
  codeType: string;
  product?: {
    name: string;
    description?: string;
    brand?: string;
    imageUrl?: string;
    upc?: string;
  };
}

export async function lookupBarcode(barcode: string): Promise<GoUPCResponse | null> {
  const apiKey = process.env.GO_UPC_API_KEY || "YOUR_GO_UPC_API_KEY_HERE"; 
  
  if (apiKey === "YOUR_GO_UPC_API_KEY_HERE") {
    console.warn("Go-UPC API Key not set. Lookups will return null.");
    return null;
  }

  try {
    const response = await fetch(`https://go-upc.com/api/v1/code/${barcode}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Go-UPC API responded with status: ${response.status}`);
    }

    const data: GoUPCResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Barcode lookup failed:", error);
    return null;
  }
}

/**
 * Placeholder for future Open Food Facts integration (Great fallback source)
 */
export async function lookupOpenFoodFacts(barcode: string) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
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
}