import React from "react";
import { Theme, TextSize, Language } from "../types";
import { translations, TranslationType } from "../translations";

interface SettingsProps {
  theme: Theme;
  onThemeChange: (val: Theme) => void;
  textSize: TextSize;
  onTextSizeChange: (val: TextSize) => void;
  language: Language;
  onLanguageChange: (val: Language) => void;
  autoBrackets: boolean;
  onAutoBracketsChange: (val: boolean) => void;
  t: TranslationType;
  customGeminiKey: string;
  onCustomGeminiKeyChange: (val: string) => void;
}

export default function Settings({
  theme,
  onThemeChange,
  textSize,
  onTextSizeChange,
  language,
  onLanguageChange,
  autoBrackets,
  onAutoBracketsChange,
  t,
  customGeminiKey,
  onCustomGeminiKeyChange,
}: SettingsProps) {
  const isDark = theme === "dark";

  const [apiKeyInput, setApiKeyInput] = React.useState(customGeminiKey);
  const [showApiInfo, setShowApiInfo] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState("");

  React.useEffect(() => {
    setApiKeyInput(customGeminiKey);
  }, [customGeminiKey]);

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      setSaveStatus(language === "en" ? "Please enter a valid API Key" : "অনুগ্রহ করে একটি সঠিক এপিআই কি দিন");
      return;
    }
    onCustomGeminiKeyChange(apiKeyInput.trim());
    setSaveStatus(language === "en" ? "API Key saved locally!" : "এপিআই কি সফলভাবে সংরক্ষিত হয়েছে!");
    setTimeout(() => setSaveStatus(""), 4000);
  };

  const handleClearApiKey = () => {
    onCustomGeminiKeyChange("");
    setApiKeyInput("");
    setSaveStatus(language === "en" ? "API Key removed." : "এপিআই কি মুছে ফেলা হয়েছে।");
    setTimeout(() => setSaveStatus(""), 4000);
  };

  return (
    <div className={`flex-1 overflow-y-auto p-6 md:p-8 max-w-2xl mx-auto w-full ${isDark ? "bg-black text-white" : "bg-white text-black"}`} id="settings-container">
      <div className="space-y-6" id="settings-form">
        <div className={`border-b pb-3 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <h2 className="text-[10px] font-mono tracking-widest uppercase opacity-60">{t.settingsTitle}</h2>
        </div>

        {/* Theme Control */}
        <div className={`space-y-2 flex flex-col md:flex-row md:items-center justify-between py-3 border-b ${isDark ? "border-white/5" : "border-zinc-100"}`} id="setting-theme">
          <div>
            <label className="text-sm font-bold tracking-tight block">{t.themeLabel}</label>
            <span className="text-xs opacity-50 font-sans">Select pure interface skin</span>
          </div>
          <div className="flex space-x-2 mt-2 md:mt-0">
            <button
              onClick={() => onThemeChange("dark")}
              className={`px-4 py-1.5 text-[10px] font-bold font-sans border uppercase tracking-wider transition-colors ${
                theme === "dark"
                  ? "bg-white text-black border-white"
                  : isDark
                  ? "bg-transparent text-zinc-500 border-white/10 hover:text-white hover:border-white/30"
                  : "bg-transparent text-zinc-400 border-zinc-200 hover:text-black hover:border-black"
              }`}
            >
              {t.themeDark}
            </button>
            <button
              onClick={() => onThemeChange("light")}
              className={`px-4 py-1.5 text-[10px] font-bold font-sans border uppercase tracking-wider transition-colors ${
                theme === "light"
                  ? "bg-black text-white border-black"
                  : isDark
                  ? "bg-transparent text-zinc-500 border-white/10 hover:text-white hover:border-white/30"
                  : "bg-transparent text-zinc-400 border-zinc-200 hover:text-black hover:border-black"
              }`}
            >
              {t.themeLight}
            </button>
          </div>
        </div>

        {/* Text Size Control */}
        <div className={`space-y-2 flex flex-col md:flex-row md:items-center justify-between py-3 border-b ${isDark ? "border-white/5" : "border-zinc-100"}`} id="setting-text-size">
          <div>
            <label className="text-sm font-bold tracking-tight block">{t.textSizeLabel}</label>
            <span className="text-xs opacity-50 font-sans">Sizing for editor and outputs</span>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:space-x-1 gap-1 mt-2 md:mt-0">
            {(["sm", "md", "lg", "xl"] as TextSize[]).map((size) => {
              const labelMap = {
                sm: "SM",
                md: "MD",
                lg: "LG",
                xl: "XL",
              };
              const active = textSize === size;
              return (
                <button
                  key={size}
                  onClick={() => onTextSizeChange(size)}
                  className={`px-4 py-1.5 text-[10px] font-bold font-sans border transition-colors ${
                    active
                      ? isDark
                        ? "bg-white text-black border-white"
                        : "bg-black text-white border-black"
                      : isDark
                      ? "border-white/10 text-zinc-500 hover:border-white/30 hover:text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {labelMap[size]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Control */}
        <div className={`space-y-2 flex flex-col md:flex-row md:items-center justify-between py-3 border-b ${isDark ? "border-white/5" : "border-zinc-100"}`} id="setting-language">
          <div>
            <label className="text-sm font-bold tracking-tight block">{t.langLabel}</label>
            <span className="text-xs opacity-50 font-sans">App controls & documentation texts</span>
          </div>
          <div className="flex space-x-2 mt-2 md:mt-0">
            <button
              onClick={() => onLanguageChange("en")}
              className={`px-4 py-1.5 text-[10px] font-bold font-sans border transition-colors uppercase tracking-wider ${
                language === "en"
                  ? isDark
                    ? "bg-white text-black border-white"
                    : "bg-black text-white border-black"
                  : isDark
                  ? "border-white/10 text-zinc-500 hover:border-white/30 hover:text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {t.langEn}
            </button>
            <button
              onClick={() => onLanguageChange("bn")}
              className={`px-4 py-1.5 text-[10px] font-bold font-sans border transition-colors uppercase tracking-wider ${
                language === "bn"
                  ? isDark
                    ? "bg-white text-black border-white"
                    : "bg-black text-white border-black"
                  : isDark
                  ? "border-white/10 text-zinc-500 hover:border-white/30 hover:text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {t.langBn}
            </button>
          </div>
        </div>

        {/* Auto Brackets Control */}
        <div className={`space-y-2 flex flex-col md:flex-row md:items-center justify-between py-3 border-b ${isDark ? "border-white/5" : "border-zinc-100"}`} id="setting-brackets">
          <div>
            <label className="text-sm font-bold tracking-tight block">{t.otherControlLabel}</label>
            <span className="text-xs opacity-50 font-sans">Auto complete brackets and quotes</span>
          </div>
          <div className="flex space-x-2 mt-2 md:mt-0">
            <button
              onClick={() => onAutoBracketsChange(true)}
              className={`px-4 py-1.5 text-[10px] font-bold font-sans border uppercase tracking-wider transition-colors ${
                autoBrackets
                  ? isDark
                    ? "bg-white text-black border-white"
                    : "bg-black text-white border-black"
                  : isDark
                  ? "border-white/10 text-zinc-500 hover:border-white/30 hover:text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {t.otherControlOn}
            </button>
            <button
              onClick={() => onAutoBracketsChange(false)}
              className={`px-4 py-1.5 text-[10px] font-bold font-sans border uppercase tracking-wider transition-colors ${
                !autoBrackets
                  ? isDark
                    ? "bg-white text-black border-white"
                    : "bg-black text-white border-black"
                  : isDark
                  ? "border-white/10 text-zinc-500 hover:border-white/30 hover:text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {t.otherControlOff}
            </button>
          </div>
        </div>

        {/* Custom Gemini API Key Control */}
        <div className={`space-y-3 py-4 border-b ${isDark ? "border-white/5" : "border-zinc-100"}`} id="setting-custom-api">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-bold tracking-tight block">
                {language === "en" ? "Custom Gemini API Key" : "কাস্টম জেমিনি এপিআই কি (API Key)"}
              </label>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowApiInfo(!showApiInfo)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono text-[10px] font-bold cursor-pointer select-none transition-colors ${
                    showApiInfo 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : isDark 
                      ? "border-white/20 text-zinc-400 hover:border-white/50 hover:text-white" 
                      : "border-zinc-300 text-zinc-500 hover:border-zinc-600"
                  }`}
                  title="Security Information"
                  id="btn-api-info"
                >
                  i
                </button>
                {showApiInfo && (
                  <div className={`absolute left-0 top-7 z-35 w-72 p-3 text-[11px] leading-relaxed border rounded shadow-xl ${
                    isDark ? "bg-zinc-900 text-zinc-200 border-white/10" : "bg-white text-zinc-700 border-zinc-200"
                  }`} id="api-info-bubble">
                    The API is not going to the site's server, it is being stored locally, so your API cannot be used by anyone else, not even the developer
                  </div>
                )}
              </div>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 border font-mono uppercase tracking-wider ${
              customGeminiKey ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-blue-500 border-blue-500/20 bg-blue-500/5"
            }`}>
              {customGeminiKey ? (language === "en" ? "Active" : "সক্রিয়") : (language === "en" ? "Optional" : "ঐচ্ছিক")}
            </span>
          </div>
          
          <p className="text-xs opacity-50 font-sans">
            {language === "en" 
              ? "Use your personal Gemini API key to run chat assistant. If left empty, default server API is used." 
              : "আপনার নিজস্ব জেমিনি এপিআই কি ব্যবহার করে চ্যাট অ্যাসিস্ট্যান্ট চালান। এটি ফাঁকা রাখলে ডিফল্ট সার্ভার এপিআই ব্যবহৃত হবে।"}
          </p>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className={`flex-1 px-3 py-1.5 font-mono text-xs border rounded focus:outline-none ${
                isDark 
                  ? "bg-black text-white border-white/10 focus:border-white/30 font-semibold" 
                  : "bg-white text-black border-zinc-200 focus:border-black font-semibold"
              }`}
              id="custom-api-input"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveApiKey}
                className={`px-4 py-1.5 text-[10px] font-bold font-sans border uppercase tracking-wider transition-colors cursor-pointer ${
                  isDark
                    ? "bg-white text-black border-white hover:bg-zinc-200"
                    : "bg-black text-white border-black hover:bg-zinc-800"
                }`}
                id="btn-save-api-key"
              >
                {language === "en" ? "Save API Key" : "সংরক্ষণ করুন"}
              </button>
              {customGeminiKey && (
                <button
                  onClick={handleClearApiKey}
                  className="px-4 py-1.5 text-[10px] font-bold font-sans border uppercase tracking-wider border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  id="btn-clear-api-key"
                >
                  {language === "en" ? "Remove" : "মুছে ফেলুন"}
                </button>
              )}
            </div>
          </div>
          {saveStatus && (
            <p className={`text-[10px] font-mono ${saveStatus.includes("saved") || saveStatus.includes("সংরক্ষিত") || saveStatus.includes("locally") ? "text-emerald-500" : "text-amber-500"}`}>
              {saveStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
