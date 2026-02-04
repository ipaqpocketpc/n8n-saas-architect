
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Workflow, 
  Layers, 
  Gift, 
  DollarSign, 
  AlertCircle, 
  Zap, 
  Search,
  Box,
  ChevronLeft,
  Globe,
  Loader2,
  Briefcase,
  Users,
  ClipboardList,
  Target,
  Rocket,
  Code2,
  Megaphone,
  TrendingUp,
  Clock,
  Gauge,
  CheckCircle2,
  Download,
  Eye,
  X,
  Printer,
  FileText,
  Settings,
  Key,
  Save,
  Trash2,
  ExternalLink,
  Network,
  Info,
  HelpCircle,
  Link,
  MessageSquare
} from 'lucide-react';
import { generateSaaSIdeas, analyzeWebsite } from './services/geminiService';
import { SaaSIdea, UserSettings, GOOGLE_MODELS, OPENROUTER_MODELS, ApiProvider } from './types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- CUSTOM COMPONENTS ---

// 1. Tooltip Component
const Tooltip: React.FC<{ 
  content: string | React.ReactNode; 
  children: React.ReactNode; 
  position?: 'top' | 'bottom';
  width?: string;
}> = ({ content, children, position = 'top', width = 'w-64' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute left-1/2 -translate-x-1/2 z-[100] ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <div className={`${width} bg-slate-900 border border-slate-700 text-slate-200 text-xs p-3 rounded-lg shadow-2xl relative animate-fade-in`}>
            {content}
            {/* Pijltje */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45 ${position === 'top' ? '-bottom-1 border-t-0 border-l-0' : '-top-1 border-b-0 border-r-0 rotate-[225deg]'}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hulpfunctie om analyse te parsen (ROBUUSTE VERSIE)
const parseAnalysisText = (text: string) => {
  if (!text) return { activity: '', audience: '', tasks: '' };
  
  // 1. Verwijder inleidende babbel (alles voor de eerste "1.")
  const cleanText = text.replace(/^[\s\S]*?(?=1\.)/, '');

  // Helper om een sectie te vinden op basis van flexibele keywords
  // Zoekt naar: "Getal. [Optioneel Bold]Keyword[Optioneel Bold][Optioneel Dubbele Punt] Content"
  const extractSection = (keywords: string) => {
    // Regex uitleg:
    // \d+\.\s*           -> Zoek naar een nummer, punt en spaties (bijv "1. ")
    // (?:\*\*)?          -> Optioneel dikgedrukt start (**)
    // .*?                -> Misschien wat tekst ervoor
    // (${keywords})      -> De zoekterm (bijv Kernactiviteit)
    // .*?                -> Misschien wat tekst erna
    // (?:\*\*)?          -> Optioneel dikgedrukt eind (**)
    // :?                 -> Optionele dubbele punt
    // \s*                -> Spaties
    // ([\s\S]*?)         -> CAPTURE GROUP 1: De inhoud die we willen
    // (?=(?:\n\s*\d+\.)|$) -> Stop als we een nieuw nummer zien (bijv "2.") OF het einde van de tekst
    
    const regex = new RegExp(`\\d+\\.\\s*(?:\\*\\*)?.*?(${keywords}).*?(?:\\*\\*)?:?\\s*([\\s\\S]*?)(?=(?:\\n\\s*\\d+\\.)|$)`, 'i');
    const match = cleanText.match(regex);
    return match ? match[2].trim() : '';
  };

  const activity = extractSection('Kernactiviteit|Activiteit');
  const audience = extractSection('Doelgroep|Klanten');
  const tasks = extractSection('Repeterende|Taken|Processen|Automatisering|Kansen');

  return { activity, audience, tasks };
};

// Hulpcomponent om tekst met **dikgedrukt** te renderen
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// Geavanceerde renderer voor paragrafen en lijsten
const RichTextRenderer: React.FC<{ text: string, className?: string }> = ({ text, className = "text-slate-300" }) => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');

  return (
    <div className={`space-y-2 ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        // Check voor bullet points (*, -, of •) of genummerde lijsten binnen de tekst
        if (trimmed.match(/^[\*\-•]\s/) || trimmed.match(/^\d+\.\s/)) {
           const content = trimmed.replace(/^[\*\-•]\s/, '').replace(/^\d+\.\s/, '');
           return (
             <div key={index} className="flex items-start gap-2 pl-2">
               <div className="mt-2 w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0"></div>
               <span className="leading-relaxed"><FormattedText text={content} /></span>
             </div>
           );
        }
        return (
          <p key={index} className="leading-relaxed text-base">
            <FormattedText text={trimmed} />
          </p>
        );
      })}
    </div>
  );
};

const WebsiteAnalysisCard: React.FC<{ analysis: string, url: string }> = ({ analysis, url }) => {
  const { activity, audience, tasks } = parseAnalysisText(analysis);
  
  // Als parsing compleet faalt (geen enkele sectie gevonden), toon dan fallback
  const showFallback = !activity && !audience && !tasks;

  if (showFallback) {
    return (
       <div className="max-w-4xl mx-auto mb-10 bg-indigo-950/30 border border-indigo-500/30 p-8 rounded-2xl animate-fade-in shadow-xl shadow-black/20">
        <div className="flex items-center gap-3 mb-6 border-b border-indigo-500/20 pb-4">
           <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400">
             <Globe size={24} />
           </div>
           <h3 className="text-indigo-200 font-bold text-xl">Bedrijfsanalyse: {url}</h3>
        </div>
        <div className="prose prose-invert max-w-none text-slate-300">
          <RichTextRenderer text={analysis} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mb-12 animate-fade-in space-y-6">
      <div className="flex items-center gap-3 px-2 mb-2">
         <Globe className="text-indigo-400" size={20} />
         <h3 className="text-slate-400 font-medium text-sm uppercase tracking-wide">Analyse resultaten voor <span className="text-white font-bold ml-1">{url}</span></h3>
         <Tooltip content="Deze data is live opgehaald via Google Search Grounding. Het vormt de basis voor de ideeën.">
            <HelpCircle size={16} className="text-slate-600 hover:text-indigo-400 cursor-help transition-colors" />
         </Tooltip>
      </div>
      
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg hover:border-indigo-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shadow-inner shadow-blue-500/5 group-hover:scale-110 transition-transform">
              <Briefcase size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xl text-white">Kernactiviteit</h4>
                <Tooltip content="De primaire producten of diensten waarmee dit bedrijf geld verdient.">
                  <Info size={16} className="text-slate-600 hover:text-blue-400 cursor-help" />
                </Tooltip>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Wat doen ze precies?</span>
            </div>
          </div>
          <div className="pl-1">
             <RichTextRenderer text={activity || "Geen details gevonden."} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg hover:border-purple-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shadow-inner shadow-purple-500/5 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xl text-white">Doelgroep</h4>
                <Tooltip content="Wie is de ideale klant? B2B of B2C? Welke demografie en pijnpunten hebben ze?">
                  <Info size={16} className="text-slate-600 hover:text-purple-400 cursor-help" />
                </Tooltip>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Wie is de klant?</span>
            </div>
          </div>
          <div className="pl-1">
             <RichTextRenderer text={audience || "Geen details gevonden."} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-lg hover:border-pink-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4 relative z-10">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 shadow-inner shadow-pink-500/5 group-hover:scale-110 transition-transform">
              <ClipboardList size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xl text-white">Automatisering Kansen</h4>
                <Tooltip content="Taken die repetitief, administratief en foutgevoelig zijn. Dit is goud voor SaaS.">
                  <Info size={16} className="text-slate-600 hover:text-pink-400 cursor-help" />
                </Tooltip>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Repeterende taken & Processen</span>
            </div>
          </div>
          <div className="pl-1 relative z-10">
             <RichTextRenderer text={tasks || "Geen details gevonden."} />
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [context, setContext] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [ideas, setIdeas] = useState<SaaSIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<SaaSIdea | null>(null);
  const [analyzedContext, setAnalyzedContext] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State 
  const [userSettings, setUserSettings] = useState<UserSettings>({
    provider: 'google', // Default
    apiKey: '',
    modelId: 'gemini-2.0-flash',
    openRouterApiKey: '',
    openRouterModelId: 'anthropic/claude-3.5-sonnet'
  });

  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('saasArchitectSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setUserSettings({ 
            provider: 'google', 
            openRouterModelId: 'anthropic/claude-3.5-sonnet',
            ...parsed 
        });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('saasArchitectSettings', JSON.stringify(userSettings));
    setShowSettings(false);
  };

  const clearSettings = () => {
    localStorage.removeItem('saasArchitectSettings');
    setUserSettings({ 
        provider: 'google',
        apiKey: '', 
        modelId: 'gemini-2.0-flash',
        openRouterApiKey: '',
        openRouterModelId: 'anthropic/claude-3.5-sonnet'
    });
    setShowSettings(false);
  };

  const hasValidConfig = () => {
      if (userSettings.provider === 'google') {
          return !!userSettings.apiKey || (typeof process !== 'undefined' && !!process.env.API_KEY);
      }
      if (userSettings.provider === 'openrouter') {
          return !!userSettings.openRouterApiKey;
      }
      return false;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.trim() && !websiteUrl.trim()) return;
    
    if (!hasValidConfig()) {
      setError("API Key ontbreekt voor de gekozen provider. Controleer instellingen.");
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    setIdeas([]);
    setSelectedIdea(null);
    setAnalyzedContext(null);

    try {
      let analysisResult = undefined;

      if (websiteUrl.trim()) {
        setLoadingStatus(`Website analyseren... (${userSettings.provider === 'openrouter' ? 'via Perplexity' : 'via Google'})`);
        analysisResult = await analyzeWebsite(websiteUrl, userSettings);
        setAnalyzedContext(analysisResult);
      }

      setLoadingStatus("SaaS blauwdrukken ontwerpen...");
      const generatedIdeas = await generateSaaSIdeas(context, analysisResult, userSettings);
      setIdeas(generatedIdeas);
    } catch (err: any) {
      setError(err.message || "Er is iets misgegaan.");
      if (err.message?.includes("API Key") || err.message?.includes("OpenRouter")) {
        setShowSettings(true);
      }
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    if (!selectedIdea) return;
    const { activity, audience, tasks } = parseAnalysisText(analyzedContext || '');

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${selectedIdea.title}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.5; color: #333; }
          h1 { font-size: 24pt; color: #1e3a8a; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
          h2 { font-size: 18pt; color: #1e3a8a; margin-top: 30px; margin-bottom: 10px; }
          h3 { font-size: 14pt; color: #333; font-weight: bold; margin-top: 20px; margin-bottom: 5px; }
          p, li { font-size: 11pt; margin-bottom: 10px; }
          .highlight { color: #2563eb; font-weight: bold; }
          .box { border: 1px solid #ccc; background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td { padding: 10px; vertical-align: top; }
          .label { font-size: 9pt; color: #666; text-transform: uppercase; font-weight: bold; }
          .value { font-size: 12pt; font-weight: bold; color: #000; }
        </style>
      </head>
      <body>
        <h1>${selectedIdea.title}</h1>
        <p style="font-size: 14pt; font-style: italic;">${selectedIdea.oneLiner}</p>
        
        <table>
          <tr>
            <td style="background:#f0f9ff; border:1px solid #e0e0e0;">
               <div class="label">Prijs Strategie</div>
               <div class="value" style="color:#059669;">${selectedIdea.blueprint.pricingStrategy}</div>
            </td>
            <td style="background:#f0f9ff; border:1px solid #e0e0e0;">
               <div class="label">Bouwtijd</div>
               <div class="value" style="color:#2563eb;">${selectedIdea.blueprint.speedToLaunch}</div>
            </td>
            <td style="background:#f0f9ff; border:1px solid #e0e0e0;">
               <div class="label">Complexiteit</div>
               <div class="value">${selectedIdea.blueprint.difficultyRating}/100</div>
            </td>
          </tr>
        </table>

        ${analyzedContext ? `
        <h2>1. Bedrijfsanalyse</h2>
        <div class="box">
          <h3>Kernactiviteit</h3>
          <p>${activity}</p>
          <h3>Doelgroep</h3>
          <p>${audience}</p>
          <h3>Automatisering Kansen</h3>
          <p>${tasks}</p>
        </div>
        ` : ''}

        <h2>2. Het SaaS Concept</h2>
        <h3>Het Probleem</h3>
        <p>${selectedIdea.blueprint.painPoint}</p>
        <h3>De Oplossing & Timing</h3>
        <p>${selectedIdea.blueprint.whyNow}</p>
        
        <div class="box">
          <h3>MVP Features</h3>
          <ul>
            ${selectedIdea.blueprint.mvpFeatures.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <h2>3. De Techniek</h2>
        <div class="box">
          <h3>Automatisering Workflow (n8n)</h3>
          <p>${selectedIdea.blueprint.automation}</p>
          <p><strong>Benodigde Nodes:</strong> ${selectedIdea.blueprint.n8nNodes.join(', ')}</p>
        </div>

        <table>
           <tr>
             <td>
               <h3>Tech Stack</h3>
               <p>${selectedIdea.blueprint.techStack.join(', ')}</p>
             </td>
             <td>
               <h3>Marketing Kanalen</h3>
               <p>${selectedIdea.blueprint.marketingChannels.join(', ')}</p>
             </td>
           </tr>
        </table>

        <h2>4. User Experience</h2>
        <p><strong>Abstractie:</strong> ${selectedIdea.blueprint.abstraction}</p>
        <p><strong>Polish (Eindproduct):</strong> ${selectedIdea.blueprint.polish}</p>
        
        <br/><br/>
        <p style="font-size:9pt; color:#999; text-align:center;">Gegenereerd met n8n SaaS Architect</p>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Blueprint-${selectedIdea.title.replace(/\s+/g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current || !selectedIdea) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [imgWidth, imgHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Blueprint-${selectedIdea.title.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
      setError("Kon PDF niet genereren.");
    } finally {
      setIsExporting(false);
    }
  };

  const resetSelection = () => {
    setSelectedIdea(null);
    setShowPdfPreview(false);
  };

  const Badge = ({ children, color = "slate", tooltip }: { children: React.ReactNode, color?: string, tooltip?: string }) => {
    const colorClasses = {
      slate: "bg-slate-800 text-slate-300 border-slate-700",
      indigo: "bg-indigo-900/30 text-indigo-300 border-indigo-700/50",
    }[color] || "bg-slate-800 text-slate-300 border-slate-700";
    
    const badge = <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${colorClasses}`}>{children}</span>;
    
    if (tooltip) {
      return <Tooltip content={tooltip}>{badge}</Tooltip>;
    }
    return badge;
  };

  const analysisData = analyzedContext ? parseAnalysisText(analyzedContext) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Tooltip content="Terug naar start (Reset alles)" position="bottom">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setIdeas([]); setSelectedIdea(null); setContext(''); setWebsiteUrl(''); setAnalyzedContext(null); setShowPdfPreview(false); }}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Workflow className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">n8n SaaS Architect <span className="hidden sm:inline font-normal text-slate-500 text-sm ml-2">| Automation Blueprints</span></span>
            </div>
          </Tooltip>
          
          <div className="flex items-center gap-3">
             <Tooltip content="Configureer API Keys en kies AI Modellen" position="bottom">
               <button 
                 onClick={() => setShowSettings(true)}
                 className={`p-2 rounded-lg transition-colors relative flex items-center gap-2 border ${
                   !hasValidConfig() 
                     ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse' 
                     : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
                 }`}
                 title=""
               >
                 <Settings size={20} />
                 {!hasValidConfig() && (
                   <span className="text-xs font-bold pr-1">Start Hier</span>
                 )}
               </button>
             </Tooltip>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 no-print">
        
        {!selectedIdea && (
          <div className="space-y-10 animate-fade-in">
            {ideas.length === 0 && !loading && !analyzedContext && (
              <div className="text-center space-y-6 py-8">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white pb-2">
                  Bouw software <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">zonder te coderen</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Transformeer n8n workflows in winstgevende producten. Voer je website in voor een analyse op maat.
                </p>
                {!hasValidConfig() && (
                    <div className="max-w-md mx-auto bg-slate-900 border border-indigo-500/50 p-4 rounded-xl shadow-lg shadow-indigo-500/10 animate-fade-in-up cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setShowSettings(true)}>
                        <p className="text-indigo-200 text-sm mb-3 flex items-center justify-center gap-2">
                           <AlertCircle size={16} /> API Configuratie vereist
                        </p>
                        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                          <Key size={16} /> Kies Provider & Key
                        </button>
                    </div>
                )}
              </div>
            )}

            <div className="max-w-2xl mx-auto w-full space-y-4">
              <form onSubmit={handleGenerate} className="space-y-6">
                
                {/* Visual "OR" Container */}
                <div className="relative">
                  
                  {/* Option 1: Website */}
                  <div className={`relative bg-slate-900 rounded-2xl border transition-all duration-300 ${websiteUrl ? 'border-indigo-500 shadow-indigo-500/10 shadow-lg' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/20 rounded-t-2xl">
                       <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                         <Link size={16} className="text-blue-400" />
                         Optie 1: Website Analyse
                       </label>
                       <Tooltip content="De AI zal deze website bezoeken om te leren wat het bedrijf doet en waar de kansen liggen.">
                          <Info size={14} className="text-slate-500 hover:text-white cursor-help" />
                       </Tooltip>
                    </div>
                    <div className="p-2">
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="www.jouwbedrijf.nl"
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 text-base py-3 px-4"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* AND/OR Connector */}
                  <div className="relative h-8 flex items-center justify-center -my-3 z-10">
                     <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800 border-t border-dashed border-slate-700 w-1/2 mx-auto"></div>
                     <span className="relative bg-slate-950 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800 rounded-full">
                       En / Of
                     </span>
                  </div>

                  {/* Option 2: Context */}
                  <div className={`relative bg-slate-900 rounded-2xl border transition-all duration-300 ${context ? 'border-purple-500 shadow-purple-500/10 shadow-lg' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/20 rounded-t-2xl">
                       <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                         <MessageSquare size={16} className="text-purple-400" />
                         Optie 2: Jouw Idee / Context
                       </label>
                       <Tooltip content="Geef extra context zoals 'Vastgoedbeheer' of 'Ik wil iets met koude acquisitie doen'.">
                          <Info size={14} className="text-slate-500 hover:text-white cursor-help" />
                       </Tooltip>
                    </div>
                    <div className="p-2">
                      <input
                        type="text"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Beschrijf een probleem of niche..."
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 text-base py-3 px-4"
                        disabled={loading}
                      />
                    </div>
                  </div>

                </div>

                {/* Big Action Button */}
                <button
                  type="submit"
                  disabled={loading || (!context.trim() && !websiteUrl.trim())}
                  className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all flex items-center justify-center gap-3 ${
                    loading || (!context.trim() && !websiteUrl.trim())
                      ? 'bg-slate-800 cursor-not-allowed text-slate-500 border border-slate-700'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/20 border border-indigo-500/50 transform hover:scale-[1.01]'
                  }`}
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={24} /> {loadingStatus}</>
                  ) : (
                    <><Sparkles size={20} className="fill-white/20" /> Genereer Blauwdrukken</>
                  )}
                </button>
                
              </form>
            </div>

            {error && (
              <div className="max-w-2xl mx-auto p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-200 flex items-center gap-3 cursor-pointer hover:bg-red-900/30 transition-colors" onClick={() => setShowSettings(true)}>
                <AlertCircle size={20} />
                <span>{error}</span>
                {(error.includes("API Key") || error.includes("OpenRouter")) && <ArrowRight size={16} className="ml-auto" />}
              </div>
            )}

            {analyzedContext && !loading && (
               <WebsiteAnalysisCard analysis={analyzedContext} url={websiteUrl} />
            )}

            {ideas.length > 0 && !loading && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white">Aanbevolen SaaS Concepten</h2>
                  <p className="text-slate-400">Gebaseerd op de analyse en jouw input</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ideas.map((idea) => (
                    <div 
                      key={idea.id} 
                      onClick={() => setSelectedIdea(idea)}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden shadow-lg"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl select-none grayscale group-hover:grayscale-0">
                        {idea.emoji}
                      </div>

                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex gap-2">
                          <Badge color="indigo" tooltip="Technische moeilijkheidsgraad om dit te bouwen.">{idea.complexity} Complexiteit</Badge>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors pr-8">
                        {idea.emoji} {idea.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">
                        {idea.oneLiner}
                      </p>
                      
                      <div className="flex items-center text-indigo-400 text-sm font-medium mt-auto group-hover:translate-x-1 transition-transform">
                        Bekijk Blueprint <ArrowRight size={16} className="ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedIdea && (
          <div className="animate-fade-in pb-20">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <button 
                onClick={resetSelection}
                className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium group"
              >
                <div className="bg-slate-800 p-1.5 rounded-md mr-2 group-hover:bg-slate-700 transition-colors">
                  <ChevronLeft size={14} /> 
                </div>
                Terug naar overzicht
              </button>

              <button 
                onClick={() => setShowPdfPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all text-sm"
              >
                 <Eye size={16} /> Bekijk PDF
              </button>
            </div>

            <div className="mb-8">
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                 <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 flex items-center gap-3">
                      <span>{selectedIdea.emoji}</span> {selectedIdea.title}
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl leading-relaxed">
                      {selectedIdea.oneLiner}
                    </p>
                 </div>
                 <div className="flex flex-col gap-2 min-w-[200px]">
                    <Tooltip content="Voorgestelde prijs op basis van de waarde die het levert.">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Verdienmodel</div>
                        <div className="text-green-400 font-bold text-lg flex items-center gap-1">
                          <DollarSign size={18} /> {selectedIdea.blueprint.pricingStrategy}
                        </div>
                      </div>
                    </Tooltip>
                    
                    <Tooltip content="Geschatte tijd om de MVP (Versie 1.0) te bouwen met n8n.">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Bouwtijd</div>
                        <div className="text-indigo-400 font-bold text-lg flex items-center gap-1">
                          <Clock size={18} /> {selectedIdea.blueprint.speedToLaunch}
                        </div>
                      </div>
                    </Tooltip>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-sm">
                  <div className="grid md:grid-cols-2 gap-8">
                     <div>
                        <div className="flex items-center gap-2 mb-3 text-red-400 font-semibold">
                           <AlertCircle size={20} /> Het Pijnpunt
                           <Tooltip content="Het specifieke probleem dat de gebruiker ervaart en waarvoor ze willen betalen."><HelpCircle size={14} className="text-slate-600" /></Tooltip>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                          {selectedIdea.blueprint.painPoint}
                        </p>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-3 text-green-400 font-semibold">
                           <Target size={20} /> De Oplossing (Why Now?)
                           <Tooltip content="Waarom is dit nu relevant (markt trend)?"><HelpCircle size={14} className="text-slate-600" /></Tooltip>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                          {selectedIdea.blueprint.whyNow}
                        </p>
                     </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                  <div className="flex items-center gap-2 mb-6 text-indigo-400 font-semibold text-lg">
                     <Rocket size={22} /> MVP Features (Versie 1.0)
                     <Tooltip content="De minimale featureset die nodig is om het product te lanceren."><HelpCircle size={16} className="text-slate-600" /></Tooltip>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedIdea.blueprint.mvpFeatures.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-indigo-500/20 transition-colors">
                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <Workflow className="text-indigo-400" /> De n8n Motor
                     <Tooltip content="De logica die op de achtergrond draait om het proces te automatiseren."><HelpCircle size={16} className="text-slate-600" /></Tooltip>
                   </h3>
                   <div className="space-y-6 relative z-10">
                      <div>
                        <div className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">De Logica</div>
                        <p className="text-slate-300 leading-relaxed bg-slate-950/30 p-4 rounded-lg border border-slate-700/50">
                          {selectedIdea.blueprint.automation}
                        </p>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                           Benodigde n8n Nodes
                           <Tooltip content="De specifieke bouwblokken die je in de n8n editor moet slepen."><HelpCircle size={14} className="text-slate-600" /></Tooltip>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedIdea.blueprint.n8nNodes.map((node, i) => (
                             <Tooltip key={i} content={`Gebruik de ${node} node in n8n.`}>
                               <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md text-sm font-medium font-mono cursor-default hover:bg-red-500/20 transition-colors">
                                 {node}
                               </span>
                             </Tooltip>
                          ))}
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="md:col-span-4 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                   <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                     <Code2 size={18} className="text-slate-400" /> Tech Stack
                     <Tooltip content="De externe tools en API's die je moet verbinden."><HelpCircle size={14} className="text-slate-600" /></Tooltip>
                   </h3>
                   <div className="flex flex-wrap gap-2">
                      {selectedIdea.blueprint.techStack.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm border border-slate-700">
                          {tech}
                        </span>
                      ))}
                   </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                   <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                     <Megaphone size={18} className="text-pink-400" /> Go-to-Market
                     <Tooltip content="Kanalen om je eerste klanten te vinden."><HelpCircle size={14} className="text-slate-600" /></Tooltip>
                   </h3>
                   <ul className="space-y-3">
                      {selectedIdea.blueprint.marketingChannels.map((channel, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                           <CheckCircle2 size={16} className="text-pink-500 mt-0.5 shrink-0" />
                           {channel}
                        </li>
                      ))}
                   </ul>
                </div>

                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 group hover:border-indigo-500/30 transition-colors">
                   <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                     <Gift size={18} className="text-purple-400" /> Het Product (Polish)
                     <Tooltip content="Wat de klant uiteindelijk ziet/krijgt (bijv. PDF, Dashboard, Email)."><HelpCircle size={14} className="text-slate-600" /></Tooltip>
                   </h3>
                   <p className="text-sm text-slate-400 leading-relaxed">
                     {selectedIdea.blueprint.polish}
                   </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm font-medium flex items-center gap-2">
                        Moeilijkheidsgraad
                        <Tooltip content="Schatting van hoe complex dit is voor iemand met basis n8n kennis."><HelpCircle size={14} className="text-slate-600" /></Tooltip>
                      </span>
                      <span className="text-white font-bold">{selectedIdea.blueprint.difficultyRating}/100</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full" 
                        style={{ width: `${selectedIdea.blueprint.difficultyRating}%` }}
                      ></div>
                   </div>
                   <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Beginner</span>
                      <span>Expert</span>
                   </div>
                </div>
              </div>
              
              <div className="md:col-span-12">
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center">
                    <div className="bg-indigo-500/10 p-4 rounded-xl text-indigo-400 flex-shrink-0">
                       <Box size={32} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                         De 'Secret Sauce' (Abstractie)
                         <Tooltip content="Hoe je de complexiteit verbergt voor de gebruiker. De gebruiker wil geen code zien."><HelpCircle size={16} className="text-slate-600" /></Tooltip>
                       </h3>
                       <p className="text-slate-300 leading-relaxed">
                         {selectedIdea.blueprint.abstraction}
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print-bg">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden animate-fade-in-up">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings size={20} className="text-indigo-400" /> Provider Instellingen
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
               </div>
               
               {/* TABS VOOR PROVIDER */}
               <div className="flex border-b border-slate-800">
                  <button 
                     onClick={() => setUserSettings({...userSettings, provider: 'google'})}
                     className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                        userSettings.provider === 'google' 
                        ? 'border-indigo-500 text-white bg-indigo-500/10' 
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                     }`}
                  >
                     Google AI Studio
                  </button>
                  <button 
                     onClick={() => setUserSettings({...userSettings, provider: 'openrouter'})}
                     className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                        userSettings.provider === 'openrouter' 
                        ? 'border-purple-500 text-white bg-purple-500/10' 
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                     }`}
                  >
                     OpenRouter (BYOK)
                  </button>
               </div>
               
               <div className="p-6 space-y-6">
                  
                  {/* GOOGLE SETTINGS */}
                  {userSettings.provider === 'google' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                           <Key size={16} /> Google Gemini API Key
                        </label>
                        <div className="relative">
                           <input 
                             type="password"
                             value={userSettings.apiKey}
                             onChange={(e) => setUserSettings({...userSettings, apiKey: e.target.value})}
                             placeholder={process.env.API_KEY ? "Standaard key actief (optioneel)" : "Plak hier je AI Studio key..."}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                           />
                           {userSettings.apiKey && (
                             <button onClick={() => setUserSettings({...userSettings, apiKey: ''})} className="absolute right-3 top-3.5 text-slate-500 hover:text-red-400"><X size={14} /></button>
                           )}
                        </div>
                        
                        {/* VISUAL FEEDBACK FOR SYSTEM KEY */}
                        {!userSettings.apiKey && (typeof process !== 'undefined' && process.env.API_KEY) && (
                            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <CheckCircle2 size={14} className="text-green-400" />
                                <span className="text-xs text-green-300 font-medium">✅ Standaard Systeem Key Actief</span>
                            </div>
                        )}

                        <p className="text-xs text-slate-500">Gratis via <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-400 hover:underline">Google AI Studio</a>.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Zap size={16} /> Kies AI Model</label>
                        <div className="space-y-2">
                          {GOOGLE_MODELS.map(model => (
                            <div 
                              key={model.id}
                              onClick={() => setUserSettings({...userSettings, modelId: model.id})}
                              className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${userSettings.modelId === model.id ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-950 border-slate-700'}`}
                            >
                              <div className="text-sm">
                                <span className="block font-medium text-slate-200">{model.name}</span>
                                <span className="text-xs text-slate-500">{model.description}</span>
                              </div>
                              {userSettings.modelId === model.id && <CheckCircle2 size={16} className="text-indigo-400" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* OPENROUTER SETTINGS */}
                  {userSettings.provider === 'openrouter' && (
                    <>
                      <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg flex gap-3 text-xs text-purple-200">
                         <Network className="shrink-0 mt-0.5" size={14} />
                         <div>
                            <strong>Hoe werkt dit?</strong><br/>
                            1. Website Analyse gebruikt <u>automatisch</u> <strong>Perplexity Sonar</strong> (voor internet toegang).<br/>
                            2. Ideeën worden gegenereerd door het model dat je hieronder kiest.
                         </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                           <Key size={16} /> OpenRouter API Key
                        </label>
                        <div className="relative">
                           <input 
                             type="password"
                             value={userSettings.openRouterApiKey}
                             onChange={(e) => setUserSettings({...userSettings, openRouterApiKey: e.target.value})}
                             placeholder="sk-or-..."
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                           />
                           {userSettings.openRouterApiKey && (
                             <button onClick={() => setUserSettings({...userSettings, openRouterApiKey: ''})} className="absolute right-3 top-3.5 text-slate-500 hover:text-red-400"><X size={14} /></button>
                           )}
                        </div>
                        <p className="text-xs text-slate-500">Haal je key via <a href="https://openrouter.ai/keys" target="_blank" className="text-purple-400 hover:underline">OpenRouter.ai</a>.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Zap size={16} /> Kies Blauwdruk Model</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                          {OPENROUTER_MODELS.map(model => (
                            <div 
                              key={model.id}
                              onClick={() => setUserSettings({...userSettings, openRouterModelId: model.id})}
                              className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${userSettings.openRouterModelId === model.id ? 'bg-purple-900/30 border-purple-500' : 'bg-slate-950 border-slate-700'}`}
                            >
                              <div className="text-sm">
                                <span className="block font-medium text-slate-200">{model.name}</span>
                                <span className="text-xs text-slate-500">{model.description}</span>
                              </div>
                              {userSettings.openRouterModelId === model.id && <CheckCircle2 size={16} className="text-purple-400" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
               </div>

               <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex gap-3">
                 <button onClick={clearSettings} className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mr-auto"><Trash2 size={16} /> Reset</button>
                 <button onClick={saveSettings} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all text-sm flex items-center gap-2"><Save size={16} /> Opslaan</button>
               </div>
            </div>
          </div>
        )}

        {selectedIdea && showPdfPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print-bg">
            <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-700">
              <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl no-print">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Eye size={20} className="text-indigo-400" /> Document Voorbeeld</h3>
                <button onClick={() => setShowPdfPreview(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-slate-950 flex justify-center print-scroll-fix">
                <div id="print-area" ref={pdfContentRef} className="bg-white text-slate-900 w-full max-w-[210mm] shadow-xl p-[15mm] min-h-[297mm] origin-top transform transition-transform">
                    {/* PDF CONTENT HERE (SAME AS BEFORE) */}
                    <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3"><span>{selectedIdea.emoji}</span> {selectedIdea.title}</h1>
                        <p className="text-slate-600 text-base font-medium">{selectedIdea.oneLiner}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Created with</div>
                        <div className="text-indigo-600 font-bold text-lg">n8n SaaS Architect</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-10">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500 uppercase font-bold mb-1">Prijs Strategie</div>
                        <div className="text-green-600 font-bold text-lg">{selectedIdea.blueprint.pricingStrategy}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500 uppercase font-bold mb-1">Bouwtijd</div>
                        <div className="text-indigo-600 font-bold text-lg">{selectedIdea.blueprint.speedToLaunch}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500 uppercase font-bold mb-1">Complexiteit</div>
                        <div className="text-slate-800 font-bold text-lg">{selectedIdea.blueprint.difficultyRating}/100</div>
                      </div>
                    </div>

                    {analysisData && (analysisData.activity || analysisData.audience) && (
                      <div className="mb-10 avoid-break">
                        <h2 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2 pb-2 border-b border-indigo-100">1. Bedrijfsanalyse</h2>
                        <div className="space-y-6">
                           {analysisData.activity && (<div><h4 className="font-bold text-slate-800 text-sm uppercase mb-1">Kernactiviteit</h4><div className="text-sm text-slate-700 leading-relaxed"><RichTextRenderer text={analysisData.activity} className="text-slate-700" /></div></div>)}
                           {analysisData.audience && (<div><h4 className="font-bold text-slate-800 text-sm uppercase mb-1">Doelgroep</h4><div className="text-sm text-slate-700 leading-relaxed"><RichTextRenderer text={analysisData.audience} className="text-slate-700" /></div></div>)}
                           {analysisData.tasks && (<div><h4 className="font-bold text-slate-800 text-sm uppercase mb-1">Kansen & Taken</h4><div className="text-sm text-slate-700 leading-relaxed"><RichTextRenderer text={analysisData.tasks} className="text-slate-700" /></div></div>)}
                        </div>
                      </div>
                    )}

                    <div className="avoid-break">
                      <h2 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2 pb-2 border-b border-indigo-100">{analysisData ? '2. Het SaaS Concept' : '1. Het SaaS Concept'}</h2>
                      <div className="space-y-6 mb-8">
                          <div className="bg-red-50 p-5 rounded-lg border border-red-100"><h3 className="font-bold text-red-800 text-sm uppercase tracking-wide flex items-center gap-2 mb-2"><AlertCircle size={16} /> Het Pijnpunt</h3><p className="text-sm text-slate-800 leading-relaxed">{selectedIdea.blueprint.painPoint}</p></div>
                          <div className="bg-green-50 p-5 rounded-lg border border-green-100"><h3 className="font-bold text-green-800 text-sm uppercase tracking-wide flex items-center gap-2 mb-2"><Target size={16} /> De Oplossing & Timing</h3><p className="text-sm text-slate-800 leading-relaxed">{selectedIdea.blueprint.whyNow}</p></div>
                      </div>
                      <div className="mb-8 pl-2"><h3 className="font-bold text-slate-900 text-sm uppercase border-b border-slate-200 pb-2 mb-4">MVP Features</h3><div className="grid grid-cols-1 gap-2">{selectedIdea.blueprint.mvpFeatures.map((f, i) => (<div key={i} className="flex items-start gap-3 text-sm text-slate-700"><div className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></div>{f}</div>))}</div></div>
                    </div>

                    <div className="page-break"></div>

                    <div className="avoid-break mt-8">
                       <h2 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2 pb-2 border-b border-indigo-100">{analysisData ? '3. De Techniek' : '2. De Techniek'}</h2>
                       <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                          <h3 className="font-bold text-indigo-900 text-base mb-4 flex items-center gap-2"><Workflow size={18} /> Automatisering Workflow (n8n)</h3>
                          <p className="text-sm text-slate-700 leading-relaxed mb-4">{selectedIdea.blueprint.automation}</p>
                          <div><div className="text-xs font-bold text-slate-500 uppercase mb-2">Benodigde n8n Nodes</div><div className="flex flex-wrap gap-2">{selectedIdea.blueprint.n8nNodes.map((node, i) => (<span key={i} className="px-3 py-1 bg-white border border-slate-300 text-xs text-slate-600 rounded font-mono">{node}</span>))}</div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-10 mb-8">
                          <div><h3 className="font-bold text-slate-900 text-xs uppercase mb-3">Tech Stack</h3><div className="flex flex-wrap gap-2">{selectedIdea.blueprint.techStack.map((tech, i) => (<span key={i} className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded border border-slate-200 font-medium">{tech}</span>))}</div></div>
                          <div><h3 className="font-bold text-slate-900 text-xs uppercase mb-3">Marketing Kanalen</h3><div className="flex flex-col gap-2">{selectedIdea.blueprint.marketingChannels.map((m, i) => (<span key={i} className="text-xs text-slate-600 flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> {m}</span>))}</div></div>
                        </div>
                    </div>

                    <div className="avoid-break mt-6 pt-6 border-t-2 border-slate-100">
                          <div className="flex gap-4 items-start mb-6">
                              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-1"><Box size={20} /></div>
                              <div><h3 className="font-bold text-slate-900 text-base">User Experience (Abstractie)</h3><p className="text-sm text-slate-600 mt-1 leading-relaxed">{selectedIdea.blueprint.abstraction}</p></div>
                          </div>
                          <div className="flex gap-4 items-start">
                              <div className="p-2 bg-purple-50 rounded-lg text-purple-600 mt-1"><Gift size={20} /></div>
                              <div><h3 className="font-bold text-slate-900 text-base">Eindproduct (Polish)</h3><p className="text-sm text-slate-600 mt-1 leading-relaxed">{selectedIdea.blueprint.polish}</p></div>
                          </div>
                    </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex flex-wrap gap-3 justify-end items-center no-print">
                <button onClick={() => setShowPdfPreview(false)} className="mr-auto px-4 py-2 text-slate-400 hover:text-white font-medium text-sm">Sluiten</button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"><Printer size={16} /> Print</button>
                <button onClick={handleDownloadWord} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"><FileText size={16} /> Word</button>
                <button onClick={handleDownloadPDF} disabled={isExporting} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">{isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}{isExporting ? 'Bezig...' : 'Download PDF'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
