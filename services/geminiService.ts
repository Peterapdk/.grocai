
import { GoogleGenAI, Type } from "@google/genai";
import { INITIAL_PROMPT, CATEGORY_STYLES } from "../constants";
import { withTimeout } from "../lib/timeout";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please select an API key in the app settings.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function categorizeAndPriceItem(itemName: string, location?: string) {
  const fallback = {
    category: "Andet",
    emoji: "🛒",
    color: "#71717a"
  };

  return withTimeout(
    (async () => {
      try {
        const ai = getAI();
        const prompt = `Kategoriser og find en gennemsnitlig butikspris for: "${itemName}". 
        Lokalitet: ${location || "Danmark"}.
        
        Returner prisen som et tal.`;

        // Removing googleSearch and thinkingConfig to stay within free tier limits
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            systemInstruction: INITIAL_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: { 
                  type: Type.STRING,
                  description: "Det præcise kategorinavn fra den tilladte liste."
                },
                emoji: { 
                  type: Type.STRING, 
                  description: "En enkelt emoji der repræsenterer varen." 
                },
                color: { 
                  type: Type.STRING, 
                  description: "Hex-farvekoden der svarer præcis til den valgte kategori." 
                },
                approxPrice: {
                  type: Type.NUMBER,
                  description: "Gennemsnitspris i DKK."
                }
              },
              required: ["category", "emoji", "color"]
            }
          }
        });

        const result = JSON.parse(response.text || '{}');
        
        if (!CATEGORY_STYLES[result.category]) {
          result.category = "Andet";
          result.color = CATEGORY_STYLES["Andet"].color;
        }

        return result;
      } catch (error: any) {
        console.error("Gemini categorization failed:", error);
        return fallback;
      }
    })(),
    15000, // 15 second timeout
    fallback
  );
}

export async function batchCategorizeItems(itemNames: string[]) {
  if (itemNames.length === 0) return [];
  
  try {
    const ai = getAI();
    const prompt = `Kategoriser følgende varer: [${itemNames.join(", ")}]. 
    For hver vare, find den korrekte kategori, en passende emoji og den tilhørende hex-farve.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              emoji: { type: Type.STRING },
              color: { type: Type.STRING }
            },
            required: ["name", "category", "emoji", "color"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || '[]');
    return results.map((res: any) => {
      if (!CATEGORY_STYLES[res.category]) {
        res.category = "Andet";
        res.color = CATEGORY_STYLES["Andet"].color;
      }
      return res;
    });
  } catch (error) {
    console.error("Batch categorization failed:", error);
    return itemNames.map(name => ({
      name,
      category: "Andet",
      emoji: "🛒",
      color: "#71717a"
    }));
  }
}

export async function searchItemContext(barcode: string) {
  const fallback = { name: "Ukendt vare", brand: undefined as string | undefined, imageUrl: undefined as string | undefined };

  return withTimeout(
    (async () => {
      try {
        const ai = getAI();
        const prompt = `Find produktinformation for denne stregkode: "${barcode}". 
        Brug Google Søgning til at identificere produktet.
        Returner produktnavn, brand (hvis muligt) og en URL til et produktbillede (hvis muligt).`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Produktets fulde navn." },
                brand: { type: Type.STRING, description: "Produktets brand/mærke." },
                imageUrl: { type: Type.STRING, description: "URL til et billede af produktet." }
              },
              required: ["name"]
            }
          }
        });

        const result = JSON.parse(response.text || '{}');
        return {
          name: result.name || "Ukendt vare",
          brand: result.brand as string | undefined,
          imageUrl: result.imageUrl as string | undefined
        };
      } catch (error) {
        console.error("Failed to search item context:", error);
        return fallback;
      }
    })(),
    10000, // Reduced timeout to 10s for barcode lookup
    fallback
  );
}

export async function getShoppingInsights(items: string[], otherListsContext: string = "", location?: string) {
  if (items.length === 0 && !otherListsContext) return null;

  try {
    const ai = getAI();
    const prompt = `Analyser denne nuværende indkøbsliste: [${items.join(", ")}]. 
    Her er context fra andre/tidligere lister: [${otherListsContext}].
    Nuværende brugerplacering: ${location || "Danmark"}.
    
    BUTIKSPRIORITERING:
    - Vores lokale Coop 365 er den foretrukne butik.
    - Lidl, Løvbjerg og Rema 1000 er standardbutikker.
    - Føtex, Bilka og Meny skal kun foreslås, hvis der er store besparelser at hente.
    
    Opgaver:
    1. Undersøg priser og giv 1-2 "Smarte Tips" (hints) til besparelser baseret på ovenstående butiksprioritering.
    2. Foreslå 2-3 "Glemte varer" (suggestions).
    
    Returner strengt gyldig JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedTotal: { type: Type.NUMBER }
          },
          required: ["hints", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Failed to fetch insights:", error);
    return null;
  }
}

export async function findNearbyStores(location: { latitude: number, longitude: number }) {
  try {
    const ai = getAI();
    const prompt = `Find de 5 nærmeste dagligvarebutikker (supermarkeder) i nærheden af min placering.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
      }
    });

    return response;
  } catch (error) {
    console.error("Failed to find nearby stores:", error);
    return null;
  }
}
