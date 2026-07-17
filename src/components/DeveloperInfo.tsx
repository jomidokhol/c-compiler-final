import React from "react";
import { Theme } from "../types";
import { TranslationType } from "../translations";
import { MessageCircle, Facebook } from "lucide-react";

interface DeveloperInfoProps {
  theme: Theme;
  t: TranslationType;
}

export default function DeveloperInfo({ theme, t }: DeveloperInfoProps) {
  const isDark = theme === "dark";

  return (
    <div className={`flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full ${isDark ? "bg-black text-white" : "bg-white text-black"}`} id="dev-info-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-none" id="info-grid">
        {/* Left Side: Guide & Terms */}
        <div className="space-y-6" id="guide-terms-column">
          {/* User Guide */}
          <div className="space-y-3" id="guide-section">
            <h2 className="text-[10px] font-mono tracking-widest uppercase opacity-50 border-b pb-1 ${isDark ? 'border-white/10' : 'border-zinc-200'}">
              {t.userGuideTitle}
            </h2>
            <ul className="space-y-2 text-sm font-sans leading-relaxed" id="guide-steps">
              <li className="flex items-start">
                <span className="font-mono text-xs opacity-55 mr-2">01.</span>
                <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>{t.userGuideStep1}</span>
              </li>
              <li className="flex items-start">
                <span className="font-mono text-xs opacity-55 mr-2">02.</span>
                <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>{t.userGuideStep2}</span>
              </li>
              <li className="flex items-start">
                <span className="font-mono text-xs opacity-55 mr-2">03.</span>
                <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>{t.userGuideStep3}</span>
              </li>
              <li className="flex items-start">
                <span className="font-mono text-xs opacity-55 mr-2">04.</span>
                <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>{t.userGuideStep4}</span>
              </li>
            </ul>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-3" id="terms-section">
            <h2 className="text-[10px] font-mono tracking-widest uppercase opacity-50 border-b pb-1 ${isDark ? 'border-white/10' : 'border-zinc-200'}">
              {t.termsTitle}
            </h2>
            <p className={`text-xs font-sans leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`} id="terms-text">
              {t.termsBody}
            </p>
          </div>
        </div>

        {/* Right Side: Developer Profile Card */}
        <div className="flex flex-col" id="developer-card-column">
          <div className="space-y-4" id="dev-profile-card">
            <h2 className="text-[10px] font-mono tracking-widest uppercase opacity-50 border-b pb-1 ${isDark ? 'border-white/10' : 'border-zinc-200'}">
              {t.devInfoTitle}
            </h2>

            <div className={`p-6 border flex flex-col items-center text-center space-y-4 ${
              isDark ? "border-white/10 bg-zinc-950" : "border-zinc-200 bg-zinc-50"
            }`} id="dev-card">
              {/* Profile Image with absolute safety constraints, colorful gradient border, & circular styling */}
              <div className="p-[3px] bg-gradient-to-tr from-[#25D366] via-[#20ba5a] to-[#1877F2] rounded-full shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105" id="dev-avatar-container">
                <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${isDark ? 'border-zinc-950 bg-zinc-800' : 'border-white bg-zinc-200'}`}>
                  <img
                    src="https://i.ibb.co.com/q3NsKTht/1770916542883.png"
                    referrerPolicy="no-referrer"
                    alt="Nur Muhammad"
                    className="w-full h-full object-cover"
                    id="dev-avatar"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold tracking-tight">{t.devName}</h3>
                <span className="text-[9px] font-mono tracking-widest opacity-50 uppercase">
                  C Developer / Lead
                </span>
              </div>

              {/* Action Buttons with colorful brand icons */}
              <div className="w-full space-y-2 font-mono text-[10px] pt-2" id="dev-social-actions">
                <a
                  href="https://wa.me/8801851956615"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center space-x-2 w-full py-2.5 border font-bold transition-all uppercase tracking-wider rounded ${
                    isDark
                      ? "bg-zinc-900 border-white/10 hover:border-[#25D366]/40 hover:bg-[#25D366]/5 text-white"
                      : "bg-white border-zinc-200 hover:border-[#25D366]/40 hover:bg-emerald-50 text-zinc-900"
                  }`}
                  id="link-whatsapp"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://www.facebook.com/NURtheBackBencher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center space-x-2 w-full py-2.5 border font-bold transition-all uppercase tracking-wider rounded ${
                    isDark
                      ? "bg-zinc-900 border-white/10 hover:border-[#1877F2]/40 hover:bg-[#1877F2]/5 text-white"
                      : "bg-white border-zinc-200 hover:border-[#1877F2]/40 hover:bg-blue-50 text-zinc-900"
                  }`}
                  id="link-facebook"
                >
                  <Facebook className="w-4 h-4 text-[#1877F2] fill-[#1877F2]" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
