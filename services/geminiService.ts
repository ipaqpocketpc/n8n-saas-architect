
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SaaSIdea, UserSettings } from "../types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const BLUEPRINT_CONTEXT = `
Jij bent een Elite SaaS Architect en Product Strateeg.
Je specialiseert je EXCLUSIEF in het bouwen van "Micro-SaaS" producten die draaien op n8n (workflow automation).

STRICT N8N MODE:
1. Je mag ALLEEN n8n adviseren als backend engine.
2. VERBODEN: Noem nooit Zapier, Make.com, Integromat of Python scripts als primair alternatief.
3. SPECIFIEK: In de 'automation' en 'n8nNodes' secties MOET je specifieke n8n node namen gebruiken (bijv. "Merge Node", "Split In Batches", "Webhook Node", "HTML Parser", "OpenAI Node", "Google Sheets Node").

Je doel is niet alleen een idee geven, maar een COMPLEET BUSINESS PLAN (zoals op IdeaBrowser.com).
Elk idee moet direct uitvoerbaar zijn met veel detail.

De kernfilosofie:
1. N8n is de motor (backend).
2. De gebruiker ziet alleen een simpele frontend (abstraction).
3. Het resultaat is gepolijst en waardevol (polish).

BELANGRIJK:
Wees niet bang om de diepte in te gaan. Geef gedetailleerde uitleg over de workflow nodes en de marketing strategie.
We willen een RIJK en WAARDEVOL document genereren.
`;

// --- OPENROUTER HELPERS ---

const callOpenRouter = async (apiKey: string, model: string, messages: any[], responseFormat?: any) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://n8n-saas-architect.app", 
      "X-Title": "n8n SaaS Architect",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      response_format: responseFormat, 
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenRouter Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content;
};

// --- GOOGLE HELPERS ---

const getGoogleClient = (apiKey?: string) => {
  // CRITICAL: Explicit fallback. If apiKey is empty string, null, or undefined, use process.env.API_KEY
  const key = (apiKey && apiKey.trim() !== '') ? apiKey : process.env.API_KEY;
  
  if (!key) {
    console.error("API Key check failed. User key empty and no env key.");
    throw new Error("Geen Google API Key gevonden. Voer een key in bij Instellingen of configureer de environment variabele.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- MAIN FUNCTIONS ---

/**
 * Stap 1: Analyseer de website
 * - Google Mode: Gebruikt 'googleSearch' tool.
 * - OpenRouter Mode: Gebruikt 'perplexity/sonar' (heeft ingebouwd internet).
 */
export const analyzeWebsite = async (url: string, settings: UserSettings): Promise<string> => {
  const prompt = `Ga naar de website ${url}. 
  Maak een uitgebreide zakelijke analyse in het Nederlands.
  
  BELANGRIJK: Geef GEEN inleiding ("Natuurlijk...", "Hier is de analyse").
  Begin DIRECT met de output volgens onderstaande structuur.
  
  Gebruik EXACT deze structuur met nummers:
  
  1. **Kernactiviteit:** [Beschrijf uitgebreid wat ze doen]
  2. **Doelgroep:** [Beschrijf gedetailleerd de doelgroep en hun kenmerken]
  3. **Repeterende taken:** [Lijst met specifieke administratieve/saaie taken die geautomatiseerd kunnen worden]
  
  Houd het professioneel en gericht op concrete automatiseringskansen.`;

  // --- OPENROUTER PATH (Via Perplexity) ---
  if (settings.provider === 'openrouter') {
    if (!settings.openRouterApiKey) throw new Error("OpenRouter API Key ontbreekt.");
    
    // We dwingen Perplexity af voor de analyse stap omdat deze online kan zoeken
    // Andere modellen op OpenRouter kunnen dit vaak niet zonder complexe tools
    try {
      return await callOpenRouter(
        settings.openRouterApiKey,
        "perplexity/sonar", // Dit model is gemaakt voor search
        [{ role: "user", content: prompt }]
      );
    } catch (e) {
      console.warn("Perplexity analyse mislukt, fallback naar gekozen model:", e);
      // Fallback naar het gekozen model (hopend dat het dingen weet)
      return await callOpenRouter(
        settings.openRouterApiKey,
        settings.openRouterModelId, 
        [{ role: "user", content: prompt }]
      );
    }
  }

  // --- GOOGLE PATH ---
  // Here we pass settings.apiKey, but getGoogleClient handles the fallback logic internally
  const ai = getGoogleClient(settings.apiKey);
  const modelId = settings.modelId || "gemini-2.0-flash";
  
  try {
    const response = await ai.models.generateContent({
      model: modelId, 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
      },
    });
    return response.text || "Kon geen analyse maken van de website.";
  } catch (error: any) {
    if (error.message?.includes("grounding")) {
        return "Google Search Grounding is niet beschikbaar voor dit model of deze key.";
    }
    throw error;
  }
};

/**
 * Stap 2: Genereer Ideeën
 */
export const generateSaaSIdeas = async (userContext: string, websiteAnalysis: string | undefined, settings: UserSettings): Promise<SaaSIdea[]> => {
  
  // JSON Structuur definitie (Voor Google Schema & OpenRouter System Prompt)
  const jsonStructure = {
    ideas: [
      {
        title: "Naam",
        emoji: "🚀",
        oneLiner: "Korte beschrijving",
        targetAudience: "Doelgroep",
        complexity: "Laag/Gemiddeld/Hoog",
        potentialRevenue: "Laag/Gemiddeld/Hoog",
        blueprint: {
          painPoint: "Probleem",
          automation: "Workflow",
          abstraction: "UI",
          polish: "Eindproduct",
          monetization: "Geld",
          whyNow: "Trend",
          mvpFeatures: ["Feature 1", "Feature 2"],
          techStack: ["Tool A", "API B"],
          n8nNodes: ["Webhook", "HTTP Request"],
          marketingChannels: ["LinkedIn", "Cold Email"],
          pricingStrategy: "€XX per maand",
          difficultyRating: 85,
          speedToLaunch: "3 dagen"
        }
      }
    ]
  };

  const basePrompt = websiteAnalysis ? `
      CONTEXT (Bedrijfsprofiel):
      "${websiteAnalysis}"
      
      SPECIFIEKE VRAAG:
      "${userContext}"
  ` : `
      CONTEXT: "${userContext}"
  `;

  const taskPrompt = `
      OPDRACHT:
      Bedenk 3 briljante, winstgevende Micro-SaaS concepten.
      Focus 100% op n8n automations.
      Geef UITGEBREIDE en GEDETAILLEERDE beschrijvingen voor elk onderdeel van de blauwdruk.
      Gebruik specifieke n8n terminologie en node namen.
  `;

  // --- OPENROUTER PATH ---
  if (settings.provider === 'openrouter') {
    if (!settings.openRouterApiKey) throw new Error("OpenRouter API Key ontbreekt.");

    const systemPrompt = `${BLUEPRINT_CONTEXT}
    
    BELANGRIJK: Je MOET antwoorden met valide JSON.
    Gebruik exact dit formaat:
    ${JSON.stringify(jsonStructure, null, 2)}`;

    const responseText = await callOpenRouter(
      settings.openRouterApiKey,
      settings.openRouterModelId,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: basePrompt + "\n" + taskPrompt }
      ],
      { type: "json_object" } // Probeer JSON mode te forceren
    );

    if (!responseText) throw new Error("Geen data ontvangen van OpenRouter.");
    
    try {
      const data = JSON.parse(responseText);
      return data.ideas.map((idea: Omit<SaaSIdea, 'id'>) => ({ ...idea, id: generateId() }));
    } catch (e) {
      console.error("OpenRouter JSON Parse Error", responseText);
      throw new Error("Het model gaf geen valide JSON terug. Probeer een slimmer model (zoals Claude 3.5 of GPT-4o).");
    }
  }

  // --- GOOGLE PATH ---
  // Here we pass settings.apiKey, but getGoogleClient handles the fallback logic internally
  const ai = getGoogleClient(settings.apiKey);
  const modelId = settings.modelId || "gemini-2.0-flash";

  // Google Schema Definitie
  const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        ideas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              emoji: { type: Type.STRING },
              oneLiner: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              complexity: { type: Type.STRING, enum: ["Laag", "Gemiddeld", "Hoog"] },
              potentialRevenue: { type: Type.STRING, enum: ["Laag", "Gemiddeld", "Hoog"] },
              blueprint: {
                type: Type.OBJECT,
                properties: {
                  painPoint: { type: Type.STRING },
                  automation: { type: Type.STRING },
                  abstraction: { type: Type.STRING },
                  polish: { type: Type.STRING },
                  monetization: { type: Type.STRING },
                  whyNow: { type: Type.STRING },
                  mvpFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                  techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                  n8nNodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  marketingChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pricingStrategy: { type: Type.STRING },
                  difficultyRating: { type: Type.NUMBER },
                  speedToLaunch: { type: Type.STRING }
                },
                required: ["painPoint", "automation", "abstraction", "polish", "monetization", "whyNow", "mvpFeatures", "techStack", "n8nNodes", "marketingChannels", "pricingStrategy", "difficultyRating", "speedToLaunch"]
              }
            },
            required: ["title", "emoji", "oneLiner", "targetAudience", "complexity", "potentialRevenue", "blueprint"]
          }
        }
      },
      required: ["ideas"]
  };

  const response = await ai.models.generateContent({
    model: modelId,
    contents: basePrompt + "\n" + taskPrompt,
    config: {
      systemInstruction: BLUEPRINT_CONTEXT,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.7,
    },
  });

  const outputText = response.text;
  if (!outputText) throw new Error("Geen data ontvangen van Gemini.");
  const data = JSON.parse(outputText);
  
  return data.ideas.map((idea: Omit<SaaSIdea, 'id'>) => ({ ...idea, id: generateId() }));
};
