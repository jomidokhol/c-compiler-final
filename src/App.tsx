import React, { useState, useEffect } from "react";
import { Theme, TextSize, Language, TabType, CompileError, CompileResult } from "./types";
import { translations } from "./translations";
import CodeEditor from "./components/CodeEditor";
import CompilerOutput from "./components/CompilerOutput";
import DeveloperInfo from "./components/DeveloperInfo";
import Settings from "./components/Settings";
import AIAssist from "./components/AIAssist";

const DEFAULT_C_CODE = `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`;

export default function App() {
  // --- Cookie/Storage Consent State ---
  const [consent, setConsent] = useState<"granted" | "declined" | "pending">(() => {
    const saved = localStorage.getItem("c_compiler_consent");
    if (saved === "granted") return "granted";
    if (saved === "declined") return "declined";
    return "pending";
  });

  // --- Persistent Settings (Conditional based on consent) ---
  const [theme, setTheme] = useState<Theme>(() => {
    const savedConsent = localStorage.getItem("c_compiler_consent");
    if (savedConsent === "granted") {
      return (localStorage.getItem("c_compiler_theme") as Theme) || "dark";
    }
    return "dark";
  });
  
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const savedConsent = localStorage.getItem("c_compiler_consent");
    if (savedConsent === "granted") {
      return (localStorage.getItem("c_compiler_text_size") as TextSize) || "md";
    }
    return "md";
  });

  const [language, setLanguage] = useState<Language>(() => {
    const savedConsent = localStorage.getItem("c_compiler_consent");
    if (savedConsent === "granted") {
      return (localStorage.getItem("c_compiler_lang") as Language) || "en";
    }
    return "en";
  });

  const [autoBrackets, setAutoBrackets] = useState<boolean>(() => {
    const savedConsent = localStorage.getItem("c_compiler_consent");
    if (savedConsent === "granted") {
      const saved = localStorage.getItem("c_compiler_autobrack");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  // --- Code & Input State ---
  const [code, setCode] = useState<string>(() => {
    const savedConsent = localStorage.getItem("c_compiler_consent");
    if (savedConsent === "granted") {
      return localStorage.getItem("c_compiler_code") || DEFAULT_C_CODE;
    }
    return DEFAULT_C_CODE;
  });

  const [stdin, setStdin] = useState<string>(() => {
    const savedConsent = localStorage.getItem("c_compiler_consent");
    if (savedConsent === "granted") {
      return localStorage.getItem("c_compiler_stdin") || "";
    }
    return "";
  });

  // --- Custom Gemini Key ---
  const [customGeminiKey, setCustomGeminiKey] = useState<string>(() => {
    const savedConsent = localStorage.getItem("c_compiler_consent");
    if (savedConsent === "granted") {
      return localStorage.getItem("c_compiler_custom_gemini_key") || "";
    }
    return "";
  });

  // --- Reset Modal Control ---
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // --- Tab Selection ---
  const [activeTab, setActiveTab] = useState<TabType>("code");

  // --- Compilation Result State ---
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileOutput, setCompileOutput] = useState<string>("");
  const [compileErrors, setCompileErrors] = useState<CompileError[]>([]);
  const [compileSuccess, setCompileSuccess] = useState<boolean>(true);
  const [hasRun, setHasRun] = useState<boolean>(false);

  // --- Save settings changes conditionally ---
  useEffect(() => {
    if (consent === "granted") {
      localStorage.setItem("c_compiler_theme", theme);
    }
  }, [theme, consent]);

  useEffect(() => {
    if (consent === "granted") {
      localStorage.setItem("c_compiler_text_size", textSize);
    }
  }, [textSize, consent]);

  useEffect(() => {
    if (consent === "granted") {
      localStorage.setItem("c_compiler_lang", language);
    }
  }, [language, consent]);

  useEffect(() => {
    if (consent === "granted") {
      localStorage.setItem("c_compiler_autobrack", String(autoBrackets));
    }
  }, [autoBrackets, consent]);

  // --- Save code & input changes conditionally ---
  useEffect(() => {
    if (consent === "granted") {
      localStorage.setItem("c_compiler_code", code);
    }
  }, [code, consent]);

  useEffect(() => {
    if (consent === "granted") {
      localStorage.setItem("c_compiler_stdin", stdin);
    }
  }, [stdin, consent]);

  // --- Save Custom Gemini Key conditionally ---
  useEffect(() => {
    if (consent === "granted") {
      localStorage.setItem("c_compiler_custom_gemini_key", customGeminiKey);
    }
  }, [customGeminiKey, consent]);

  // Consent Actions
  const handleAcceptConsent = () => {
    setConsent("granted");
    localStorage.setItem("c_compiler_consent", "granted");
    // Flush current in-memory state to persistent store immediately
    localStorage.setItem("c_compiler_theme", theme);
    localStorage.setItem("c_compiler_text_size", textSize);
    localStorage.setItem("c_compiler_lang", language);
    localStorage.setItem("c_compiler_autobrack", String(autoBrackets));
    localStorage.setItem("c_compiler_code", code);
    localStorage.setItem("c_compiler_stdin", stdin);
    localStorage.setItem("c_compiler_custom_gemini_key", customGeminiKey);
  };

  const handleDeclineConsent = () => {
    setConsent("declined");
    localStorage.setItem("c_compiler_consent", "declined");
    // Clear out any old store keys
    localStorage.removeItem("c_compiler_theme");
    localStorage.removeItem("c_compiler_text_size");
    localStorage.removeItem("c_compiler_lang");
    localStorage.removeItem("c_compiler_autobrack");
    localStorage.removeItem("c_compiler_code");
    localStorage.removeItem("c_compiler_stdin");
    localStorage.removeItem("c_compiler_custom_gemini_key");
  };

  const handleCustomGeminiKeyChange = (key: string) => {
    setCustomGeminiKey(key);
    // Explicit action to save settings can automatically grant storage permission
    if (consent === "pending") {
      setConsent("granted");
      localStorage.setItem("c_compiler_consent", "granted");
      localStorage.setItem("c_compiler_theme", theme);
      localStorage.setItem("c_compiler_text_size", textSize);
      localStorage.setItem("c_compiler_lang", language);
      localStorage.setItem("c_compiler_autobrack", String(autoBrackets));
      localStorage.setItem("c_compiler_code", code);
      localStorage.setItem("c_compiler_stdin", stdin);
    }
    if (consent === "granted") {
      localStorage.setItem("c_compiler_custom_gemini_key", key);
    }
  };

  // Reset helper
  const handleReset = () => {
    setShowResetModal(true);
  };

  // Compile Handler
  const handleCompile = async () => {
    setIsCompiling(true);
    setCompileErrors([]);
    setCompileOutput("");
    
    // Switch to output tab immediately so user sees compiling indicator
    setActiveTab("output");

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          input: stdin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to compile. Server returned error.");
      }

      const result: CompileResult = await response.json();
      setCompileOutput(result.output);
      setCompileErrors(result.errors || []);
      setCompileSuccess(result.success);
      setHasRun(true);
    } catch (err: any) {
      console.error(err);
      setCompileOutput(`[ERROR] ${err.message || "An unexpected error occurred while communicating with the compiler server."}`);
      setCompileSuccess(false);
      setCompileErrors([
        {
          line: 1,
          message: err.message || "Failed to reach compilation endpoint.",
          type: "error",
        },
      ]);
      setHasRun(true);
    } finally {
      setIsCompiling(false);
    }
  };

  const t = translations[language];
  const isDark = theme === "dark";

  return (
    <div className={`h-screen flex flex-col overflow-hidden select-none font-sans transition-none ${
      isDark ? "bg-black text-white" : "bg-white text-black"
    }`} id="app-root">
      
      {/* Top Header Grid: Single Frame Constraint */}
      <header className={`flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-b shrink-0 ${
        isDark ? "border-white/10 bg-zinc-950" : "border-zinc-200 bg-zinc-50"
      }`} id="app-header">
        
        {/* Title and Badge */}
        <div className="flex items-center space-x-4 mb-2 sm:mb-0" id="header-branding">
          <h1 className="text-base font-bold tracking-tighter uppercase font-sans">
            {language === "en" ? "C-COMPILER.IO" : "সি-কম্পাইলার.আইও"}
          </h1>
          <span className={`text-[9px] px-1.5 py-0.5 border font-mono uppercase tracking-wider ${
            isDark ? "border-white/10 text-zinc-500" : "border-zinc-200 text-zinc-500"
          }`}>
            Build 1.0.4
          </span>
        </div>

        {/* Tab Controls: Mono Font, Minimalist and Symmetrical */}
        <nav className="flex space-x-6 text-xs font-medium uppercase tracking-widest" id="tab-navigation">
          {(["code", "output", "info", "settings"] as TabType[]).map((tab) => {
            const labelMap = {
              code: t.codeTab,
              output: t.outputTab,
              info: t.guideTab,
              settings: t.settingsTab,
            };

            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-1 cursor-pointer transition-colors ${
                  isActive
                    ? isDark
                      ? "text-white border-b border-white font-semibold"
                      : "text-black border-b border-black font-semibold"
                    : isDark
                    ? "text-zinc-500 hover:text-white"
                    : "text-zinc-400 hover:text-zinc-900"
                }`}
                id={`tab-btn-${tab}`}
              >
                {labelMap[tab]}
                
                {/* Issue Indicator Alert Badge */}
                {tab === "output" && hasRun && compileErrors.length > 0 && (
                  <span className="absolute top-0 -right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Workspace Frame: Takes full remaining screen viewport */}
      <main className="flex-1 overflow-hidden relative" id="main-frame">
        {activeTab === "code" && (
          <CodeEditor
            code={code}
            onChange={setCode}
            errors={compileErrors}
            theme={theme}
            textSize={textSize}
            t={t}
            autoBrackets={autoBrackets}
            onCompile={handleCompile}
            isCompiling={isCompiling}
            onReset={handleReset}
          />
        )}

        {activeTab === "output" && (
          <CompilerOutput
            output={compileOutput}
            errors={compileErrors}
            success={compileSuccess}
            hasRun={hasRun}
            stdin={stdin}
            onStdinChange={setStdin}
            theme={theme}
            textSize={textSize}
            t={t}
            onCompile={handleCompile}
            isCompiling={isCompiling}
            code={code}
          />
        )}

        {activeTab === "info" && (
          <DeveloperInfo
            theme={theme}
            t={t}
          />
        )}

        {activeTab === "settings" && (
          <Settings
            theme={theme}
            onThemeChange={setTheme}
            textSize={textSize}
            onTextSizeChange={setTextSize}
            language={language}
            onLanguageChange={setLanguage}
            autoBrackets={autoBrackets}
            onAutoBracketsChange={setAutoBrackets}
            t={t}
            customGeminiKey={customGeminiKey}
            onCustomGeminiKeyChange={handleCustomGeminiKeyChange}
          />
        )}
      </main>
      <AIAssist
        theme={theme}
        language={language}
        code={code}
        stdin={stdin}
        customGeminiKey={customGeminiKey}
      />

      {/* Cookie/Storage Consent Floating Banner */}
      {consent === "pending" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-lg w-[calc(100%-2rem)] z-50 p-5 border rounded shadow-2xl animate-fade-in flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between md:space-x-4 bg-zinc-950 border-white/10 text-white" id="cookie-consent-popup">
          <div className="space-y-1">
            <h4 className="text-xs font-bold tracking-wider font-mono uppercase text-zinc-400">
              {language === "en" ? "Storage & Cookie Consent" : "স্টোরেজ ও কুকি সম্মতি"}
            </h4>
            <p className="text-[11px] leading-relaxed text-zinc-300 font-sans">
              {language === "en" 
                ? "We use local storage to save your C code and settings so they persist across page reloads. We never store your code on our servers." 
                : "পৃষ্ঠা রিলোড করলেও আপনার কোড এবং সেটিংস সংরক্ষিত রাখতে আমরা লোকাল স্টোরেজ ব্যবহার করি। আমরা কখনোই আপনার কোড আমাদের সার্ভারে জমা রাখি না।"}
            </p>
          </div>
          <div className="flex space-x-2 shrink-0">
            <button
              onClick={handleDeclineConsent}
              className="px-3 py-1.5 text-[9px] font-bold tracking-wider uppercase font-sans border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              id="btn-consent-decline"
            >
              {language === "en" ? "Decline" : "প্রত্যাখ্যান"}
            </button>
            <button
              onClick={handleAcceptConsent}
              className="px-3 py-1.5 text-[9px] font-bold tracking-wider uppercase font-sans bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
              id="btn-consent-accept"
            >
              {language === "en" ? "Accept & Save" : "সম্মত এবং সংরক্ষণ"}
            </button>
          </div>
        </div>
      )}

      {/* Custom Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in" id="reset-confirm-popup">
          <div className={`max-w-md w-full p-6 border rounded shadow-2xl space-y-4 ${
            isDark ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-zinc-200 text-black"
          }`}>
            <h3 className="text-sm font-bold tracking-tight uppercase font-mono border-b pb-2 flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {language === "en" ? "Confirm Code Reset" : "কোড রিসেট নিশ্চিত করুন"}
            </h3>
            <p className="text-xs opacity-80 leading-relaxed font-sans">
              {language === "en" 
                ? "Are you sure you want to delete your entire current C code? This action cannot be undone and will restore the default template." 
                : "আপনি কি নিশ্চিত যে আপনার বর্তমান সি কোডটি সম্পূর্ণ মুছে ফেলতে চান? এই কাজটি আর ফেরত নেওয়া যাবে না এবং এটি ডিফল্ট টেমপ্লেটটি ফিরিয়ে আনবে।"}
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                  isDark 
                    ? "border-white/10 hover:bg-zinc-900 text-zinc-300" 
                    : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                }`}
                id="btn-reset-cancel"
              >
                {language === "en" ? "Cancel" : "বাতিল"}
              </button>
              <button
                onClick={() => {
                  setCode(DEFAULT_C_CODE);
                  setCompileErrors([]);
                  setCompileOutput("");
                  setHasRun(false);
                  setShowResetModal(false);
                }}
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white border border-red-600 cursor-pointer transition-colors"
                id="btn-reset-confirm"
              >
                {language === "en" ? "Yes, Reset" : "হ্যাঁ, রিসেট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
