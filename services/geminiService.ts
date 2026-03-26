
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { INITIAL_PROMPT, CATEGORY_STYLES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function categorizeAndPriceItem(itemName: string, location?: string) {
  try {
    const prompt = `Kategoriser og find en gennemsnitlig butikspris for: "${itemName}". 
    Brug Google Søgning til at finde priser fra de 3 nærmeste eller mest relevante danske detailbutikker (f.eks. Netto, Rema 1000, Føtex, Bilka, Lidl). 
    Beregn gennemsnittet af disse priser i DKK.
    Lokalitet: ${location || "Danmark"}.
    
    Returner prisen som et tal. Inkluder de 3 specifikke kilder (butiksnavn og pris).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        systemInstruction: INITIAL_PROMPT + " Vigtigt: Find prisen ved at tjekke præcis 3 kilder via søgning og returner dem i 'priceSources' feltet.",
        tools: [{ googleSearch: {} }],
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
              description: "Gennemsnitspris fra kilderne i DKK."
            },
            priceSources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  store: { type: Type.STRING, description: "Navnet på butikken." },
                  price: { type: Type.NUMBER, description: "Prisen i den pågældende butik i DKK." }
                },
                required: ["store", "price"]
              },
              description: "Liste over de 3 kilder brugt til prisestimering."
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
  } catch (error) {
    console.error("Gemini categorization and pricing failed:", error);
    return {
      category: "Andet",
      emoji: "🛒",
      color: "#71717a"
    };
  }
}

export async function getShoppingInsights(items: string[], otherListsContext: string = "", location?: string) {
  if (items.length === 0 && !otherListsContext) return null;

  try {
    const prompt = `Analyser denne nuværende indkøbsliste: [${items.join(", ")}]. 
    Her er context fra andre/tidligere lister: [${otherListsContext}].
    Nuværende brugerplacering: ${location || "Danmark"}.
    
    Opgaver:
    1. Undersøg priser og giv 1-2 "Smarte Tips" (hints) til besparelser.
    2. Foreslå 2-3 "Glemte varer" (suggestions).
    
    Returner strengt gyldig JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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
    const prompt = `Find de 5 nærmeste dagligvarebutikker (supermarkeder) i nærheden af min placering.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
