
// De 5 stappen uit de blauwdruk (behouden voor backward compatibility/interne logica)
export interface BlueprintSteps {
  painPoint: string;
  automation: string;
  abstraction: string;
  polish: string;
  monetization: string;
}

// Nieuwe, uitgebreide structuur voor een rijk business plan
export interface RichBlueprint extends BlueprintSteps {
  whyNow: string;                 // Waarom is dit nu relevant?
  mvpFeatures: string[];          // Lijst met features voor versie 1.0
  techStack: string[];            // Welke tools/apis heb je nodig? (bv. OpenAI, Stripe, Airtable)
  n8nNodes: string[];            // Specifieke n8n nodes (bv. Webhook, HTTP Request, HTML Parser)
  marketingChannels: string[];    // Hoe kom je aan klanten?
  pricingStrategy: string;        // Specifiek prijsvoorstel (bv. "€29 p/m")
  difficultyRating: number;       // 1-100 score
  speedToLaunch: string;          // bv. "2 dagen", "1 week"
}

export interface SaaSIdea {
  id: string;
  title: string;
  oneLiner: string;
  targetAudience: string;
  emoji: string; // Visueel icoon voor het idee
  complexity: 'Laag' | 'Gemiddeld' | 'Hoog';
  potentialRevenue: 'Laag' | 'Gemiddeld' | 'Hoog';
  blueprint: RichBlueprint; // De vernieuwde blauwdruk
}

export type ApiProvider = 'google' | 'openrouter';

// BYOK (Bring Your Own Key) Instellingen
export interface UserSettings {
  provider: ApiProvider;
  
  // Google Settings
  apiKey: string;
  modelId: string;
  
  // OpenRouter Settings
  openRouterApiKey: string;
  openRouterModelId: string;
}

// Lijst met ondersteunde modellen voor Google
export const GOOGLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Nieuwste model, zeer snel en slim.' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Hoogste intelligentie, iets trager.' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'De standaard, snel en goedkoop.' },
];

// Lijst met ondersteunde modellen voor OpenRouter
// Voor OpenRouter is stap 1 (analyse) ALTIJD Perplexity (sonar), stap 2 is de keuze hieronder.
export const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Beste all-round model voor structuur en nuance.' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', description: 'Extreem krachtig in redeneren (Reasoning model).' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OR)', description: 'Gemini via OpenRouter.' },
  { id: 'perplexity/sonar', name: 'Perplexity Sonar', description: 'Goed met internet context (Online).' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'De standaard van OpenAI.' },
];

export interface AppState {
  context: string;
  isGenerating: boolean;
  ideas: SaaSIdea[];
  error: string | null;
  selectedIdeaId: string | null;
}
