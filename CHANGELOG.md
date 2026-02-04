# Changelog

Alle wijzigingen aan het **n8n SaaS Architect** project.

## [1.4.0] - Multi-Provider & UI Polish
*Releasedatum: Vandaag*

### Toegevoegd
*   **BYOK (Bring Your Own Key):** Volledige ondersteuning voor gebruikers om hun eigen API keys in te voeren.
*   **Multi-Provider Support:** Naast Google AI Studio nu ook ondersteuning voor **OpenRouter**.
    *   Automatische routing naar **Perplexity Sonar** voor website analyses wanneer OpenRouter is geselecteerd.
    *   Keuze uit modellen zoals Claude 3.5 Sonnet, DeepSeek R1 en GPT-4o.
*   **System Key Fallback:** Slimme logica die automatisch terugvalt op de server-side API key als de gebruiker niets invult.
*   **Strict n8n Policy:** System prompts aangescherpt om concurrenten (Zapier/Make) te verbieden en specifieke n8n node-namen te verplichten.
*   **Tooltips:** Uitgebreide contextuele hulp toegevoegd aan de hele interface.

### Gewijzigd
*   **UI Redesign:** De input sectie is gesplitst in twee duidelijke blokken ("Website" en "Context") met een "EN / OF" connector voor betere UX.
*   **Header:** Subtitel toegevoegd om focus op "Automation Blueprints" te verduidelijken.

## [1.3.0] - Export & Documentatie
### Toegevoegd
*   **Word Export (.doc):** Generatie van native Word bestanden.
*   **Verticale PDF Layout:** "Story Flow" document generatie voor PDF.
*   **Print Optimalisatie:** `@media print` stijlen.
*   **Module Specificatie:** `module_specification.json`.

## [1.2.0] - The "IdeaBrowser" Update
### Toegevoegd
*   **Rich Blueprint Data:** Uitbreiding datamodel (Why Now, Tech Stack, Pricing).
*   **Bento Grid Dashboard:** Nieuwe visuele weergave van ideeën.

## [1.1.0] - Intelligence Layer
### Toegevoegd
*   **Live Website Analyse:** Integratie met `googleSearch`.
*   **Slimme Parsing:** Regex extractie van bedrijfsdata.

## [1.0.0] - Initial Release
### Functies
*   Basis MVP met 5-stappen model.