# n8n SaaS Architect

**n8n SaaS Architect** is een geavanceerde "Business Intelligence & Ideation" tool. Het stelt ondernemers en developers in staat om bestaande bedrijven te analyseren en direct winstgevende Micro-SaaS concepten te genereren die gebouwd kunnen worden met n8n (workflow automation).

De applicatie combineert **Live Web Analysis** (via Google Search Grounding of Perplexity) met **Gestructureerde Creativiteit** (via JSON Schemas) om output van consultant-niveau te leveren.

---

## 🌟 Kernfunctionaliteiten

### 1. Intelligent Website Analysis (De Verkenner)
Voer een URL in (bijv. `www.bedrijf.nl`) en de app stuurt een AI-agent het internet op.
*   **Techniek:** Gebruikt Google Gemini (`googleSearch`) of Perplexity Sonar (via OpenRouter).
*   **Resultaat:** Een gestructureerde analyse van:
    *   **Kernactiviteit:** Wat doet het bedrijf écht?
    *   **Doelgroep:** Wie is de betalende klant?
    *   **Kansen:** Waar zitten de administratieve pijnpunten?

### 2. SaaS Blueprint Engine (De Architect)
Op basis van de analyse (of gebruikersinput) genereert de app complete business plannen.
*   **Strict n8n Policy:** De AI is geprogrammeerd om *alleen* n8n oplossingen te genereren en specifieke nodes te noemen (geen Zapier/Make).
*   **Rijke Data:** We gebruiken strikte JSON-schema's om gedetailleerde output te dwingen:
    *   Pricing Strategy & Verdienmodel
    *   Tech Stack & Benodigde n8n Nodes
    *   Marketing Kanalen & Go-to-Market
    *   MVP Feature Lijst

### 3. Bring Your Own Key (BYOK) & Multi-Provider
Gebruikers hebben volledige controle over de AI die ze gebruiken.
*   **Google AI Studio:** Gratis en snel via de officiële Google integratie.
*   **OpenRouter:** Mogelijkheid om andere modellen te gebruiken (Claude 3.5 Sonnet, GPT-4o, DeepSeek R1).
*   **Hybride Fallback:** Als de gebruiker geen key invult, valt de app automatisch terug op de ingebouwde systeem-key (indien geconfigureerd).

### 4. Professionele Export Suite
De app is gebouwd om resultaten te delen.
*   **PDF Generatie:** Zet de blauwdruk om in een clean, verticaal A4-document.
*   **Word Export:** Genereert een native `.doc` bestand met tabellen.
*   **Print Modus:** Een CSS-geoptimaliseerde printversie die alle UI-elementen stript.

---

## ⚙️ Technische Architectuur

De applicatie is gebouwd als een moderne, client-side React applicatie.

### Tech Stack
*   **Core:** React 19, TypeScript
*   **Styling:** Tailwind CSS (met custom animaties en print-modifiers)
*   **AI Backend:**
    *   Google GenAI SDK (`@google/genai`)
    *   OpenRouter API (Rest fetch)
*   **Utilities:** `lucide-react` (iconen), `jspdf` (PDF), `html2canvas` (Screenshotting)

### De "2-Traps Raket" Flow
Om hoge kwaliteit te garanderen, splitsen we het proces op:

1.  **Fase 1: Analyse (`analyzeWebsite`)**
    *   *Input:* URL.
    *   *Actie:* AI zoekt live op internet (Google of Perplexity).
    *   *Output:* Ruwe tekst met Markdown markering.
    *   *Parsing:* De frontend gebruikt Regex om de tekst op te splitsen in UI-kaarten.

2.  **Fase 2: Creatie (`generateSaaSIdeas`)**
    *   *Input:* De geparsede analyse uit Fase 1 + Context van gebruiker.
    *   *Actie:* AI genereert ideeën volgens een strikt `Schema`.
    *   *Output:* Een JSON array met volledige `RichBlueprint` objecten.

---

## 📂 Project Structuur

*   **`src/App.tsx`**: De hoofdcontroller. Bevat de state management, de UI rendering logica (Bento Grid), instellingen modal, en de export functies.
*   **`src/services/geminiService.ts`**: De brug naar de AI. Bevat logica voor zowel Google SDK als OpenRouter API calls, en de "Strict n8n" prompts.
*   **`src/types.ts`**: TypeScript definities voor Blueprints, UserSettings en AI Providers.
*   **`module_specification.json`**: Een losse blauwdruk van de "Website Analyse Module" voor hergebruik.

---

## 🚀 Installatie & Development

1.  **Environment Setup:**
    Zorg dat de `API_KEY` environment variabele is ingesteld met een geldige Google Gemini API sleutel voor de fallback functionaliteit.

2.  **Starten:**
    ```bash
    npm install
    npm start
    ```

---

## 📄 Licentie & Gebruik
Dit project is bedoeld als een tool voor "Rapid Ideation". De gegenereerde blauwdrukken dienen als startpunt voor validatie.