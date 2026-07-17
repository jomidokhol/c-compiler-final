import React, { useState, useEffect, useRef } from "react";
import { Sparkles, MessageSquare, Send, X, Trash2, Code, ShieldAlert, Cpu } from "lucide-react";
import Markdown from "react-markdown";
import { Theme, Language } from "../types";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AIAssistProps {
  theme: Theme;
  language: Language;
  code: string;
  stdin: string;
  customGeminiKey: string;
}

// Durable, high-contrast Code block with a Copy button, legible in all themes
function CodeBlock({ codeText, language }: { codeText: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-zinc-800 overflow-hidden text-left bg-zinc-950 text-zinc-100 font-mono text-[11px] w-full relative">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 select-none">
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer select-none"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-3 overflow-x-auto">
        <pre className="m-0 bg-transparent p-0 text-zinc-100 select-all whitespace-pre leading-5">
          <code>{codeText}</code>
        </pre>
      </div>
    </div>
  );
}

export default function AIAssist({ theme, language, code, stdin, customGeminiKey }: AIAssistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  // Load initial welcome message based on language
  useEffect(() => {
    const welcomeEn = "Hi! I am your **AI Programming Assistant** created by Nur Muhammad. I can analyze your C code, find potential syntax or logical mistakes, explain algorithms, or optimize your code. How can I help you today?";
    const welcomeBn = "হ্যালো! আমি আপনার **এআই প্রোগ্রামিং অ্যাসিস্ট্যান্ট** (নূর মোহাম্মদ কর্তৃক তৈরি)। আমি আপনার সি কোড বিশ্লেষণ করতে পারি, সিনট্যাক্স বা লজিক্যাল ভুলগুলো খুঁজে বের করতে পারি, অ্যালগরিদম ব্যাখ্যা করতে পারি অথবা আপনার কোড উন্নত করতে পারি। আজ আপনাকে কীভাবে সাহায্য করতে পারি?";
    
    setMessages([
      {
        role: "model",
        text: language === "en" ? welcomeEn : welcomeBn
      }
    ]);
  }, [language]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = { role: "user", text: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsTyping(true);

    if (customGeminiKey) {
      try {
        const contents = updatedMessages.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text || "" }]
        }));

        const systemInstruction = `You are a helpful, expert C programming tutor and AI assistant integrated into c-compiler.io (created by Nur Muhammad).
The user is working on the following C code in their workspace:
\`\`\`c
${code || "/* No code yet */"}
\`\`\`

Standard Input (stdin) is currently set to:
\`\`\`
${stdin || "/* No input */"}
\`\`\`

Analyze the user's input and reply appropriately in their language (e.g., Bengali, English, etc.).
If they ask to check for mistakes, look at their C code carefully, find any semantic or syntax issues, tell them exactly where they are (line/function), and explain how to solve them clearly.
If they ask you to perform small tasks (like explaining a concept, writing a short function, or modifying something), do it in a clear and friendly manner. Keep your response clear and well-formatted with markdown.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${customGeminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          let parsedErr;
          try {
            parsedErr = JSON.parse(errText);
          } catch (e) {}
          throw new Error(parsedErr?.error?.message || `Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I could not formulate an answer.";
        setMessages(prev => [...prev, { role: "model", text: responseText }]);
      } catch (err: any) {
        console.error(err);
        setMessages(prev => [
          ...prev,
          { 
            role: "model", 
            text: language === "en" 
              ? `⚠️ **Error (Custom API Key):** ${err.message || "Failed to reach Gemini. Please verify your API key."}`
              : `⚠️ **ত্রুটি (কাস্টম এপিআই কি):** ${err.message || "জেমিনি এপিআই-এর সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আপনার এপিআই কি পরীক্ষা করুন।"}`
          }
        ]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          code,
          input: stdin
        })
      });

      if (!response.ok) {
        throw new Error("Chat service is currently occupied. Please try again.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "model", text: data.text || "I could not formulate an answer." }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { 
          role: "model", 
          text: language === "en" 
            ? `⚠️ **Error:** ${err.message || "Failed to reach AI Assist. Please check your network."}`
            : `⚠️ **ত্রুটি:** ${err.message || "এআই অ্যাসিস্ট্যান্ট-এর সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"}`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputMessage);
  };

  const clearChat = () => {
    if (window.confirm(language === "en" ? "Are you sure you want to clear chat history?" : "আপনি কি চ্যাট হিস্ট্রি মুছে ফেলতে চান?")) {
      const welcomeEn = "Hi! I am your **AI Programming Assistant** created by Nur Muhammad. How can I help you today?";
      const welcomeBn = "হ্যালো! আমি আপনার **এআই প্রোগ্রামিং অ্যাসিস্ট্যান্ট** (নূর মোহাম্মদ কর্তৃক তৈরি)। আজ আপনাকে কীভাবে সাহায্য করতে পারি?";
      setMessages([
        {
          role: "model",
          text: language === "en" ? welcomeEn : welcomeBn
        }
      ]);
    }
  };

  // Quick Prompt Options
  const prompts = [
    {
      label: language === "en" ? "🔍 Find Mistakes" : "🔍 কোডের ভুল খুঁজুন",
      prompt: language === "en"
        ? "Please carefully analyze my current C code. Are there any compiler errors, logical bugs, memory leaks, or mistakes? Point them out clearly with line numbers if possible, and show how to fix them."
        : "আমার বর্তমান সি কোডটি অনুগ্রহ করে সাবধানে বিশ্লেষণ করুন। এতে কি কোনো কম্পাইলার ত্রুটি, লজিক্যাল বাগ, মেমরি লিক বা ভুল আছে? অনুগ্রহ করে স্পষ্ট করে নির্দিষ্ট লাইন নম্বর সহ ভুলগুলো বুঝিয়ে দিন এবং কীভাবে ঠিক করব তা দেখান।"
    },
    {
      label: language === "en" ? "💡 Explain Code" : "💡 কোড ব্যাখ্যা করুন",
      prompt: language === "en"
        ? "Could you please explain how my C code works step-by-step? What is the execution flow and what does each part do?"
        : "আমার সি কোডটি কীভাবে ধাপে ধাপে কাজ করছে তা বুঝিয়ে বলুন। এর এক্সিকিউশন ফ্লো এবং প্রতিটি অংশ কী কাজ করছে তা ব্যাখ্যা করুন।"
    },
    {
      label: language === "en" ? "🚀 Optimize & Improve" : "🚀 কোড উন্নত করুন",
      prompt: language === "en"
        ? "Can you optimize or improve this C code? Make it cleaner, more efficient, and apply industry-standard best practices where applicable."
        : "আপনি কি এই সি কোডটি অপ্টিমাইজ বা উন্নত করতে পারেন? এটিকে আরও পরিচ্ছন্ন ও দক্ষ করুন এবং স্ট্যান্ডার্ড বেস্ট প্র্যাকটিসগুলো প্রয়োগ করুন।"
    },
    {
      label: language === "en" ? "📝 Document/Comment" : "📝 কমেন্ট যোগ করুন",
      prompt: language === "en"
        ? "Please add helpful docstrings and comments inside my C code to make it highly readable and clean."
        : "আমার সি কোডটিতে প্রয়োজনীয় কমেন্ট যোগ করুন যাতে এটি সহজে পড়া ও বোঝা যায়।"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="ai-assist-widget">
      {/* Floating Launcher Button - Icon only, static look with no scale/pulse animations */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-full shadow-lg border border-white/15 cursor-pointer"
          id="ai-assist-launcher"
          title="AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Small Chat Window - Static positioning and rendering with no sliding transitions */}
      {isOpen && (
        <div
          className={`w-[90vw] sm:w-[380px] h-[500px] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
            isDark 
              ? "bg-zinc-950 border-white/10 text-white" 
              : "bg-white border-zinc-200 text-zinc-950"
          }`}
          id="ai-assist-chat-box"
        >
          {/* Chat Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
              isDark ? "bg-zinc-900 border-white/10" : "bg-zinc-50 border-zinc-200"
            }`}
            id="chat-header"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <div className="flex items-center space-x-1.5 font-bold text-xs uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-emerald-500" />
                <span>{language === "en" ? "AI Programming Assist" : "এআই প্রোগ্রামিং অ্যাসিস্ট"}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className={`p-1.5 rounded cursor-pointer ${
                  isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800"
                }`}
                title={language === "en" ? "Clear Chat" : "চ্যাট মুছুন"}
                id="clear-chat-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded cursor-pointer ${
                  isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800"
                }`}
                id="close-chat-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
                id={`chat-msg-${index}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : isDark
                      ? "bg-zinc-900 border border-white/5 text-zinc-100 rounded-bl-none"
                      : "bg-zinc-100 border border-zinc-200/80 text-zinc-900 rounded-bl-none"
                  }`}
                >
                  <div className="markdown-body prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed font-sans [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold [&_h1]:text-xs [&_h2]:text-xs [&_h1]:font-bold [&_h2]:font-bold [&_h1]:mt-2 [&_h2]:mt-1.5 [&_h1]:mb-0.5 [&_h2]:mb-0.5">
                    <Markdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const codeText = String(children).replace(/\n$/, "");
                          const isInline = !className?.includes("language-") && !codeText.includes("\n");

                          if (!isInline) {
                            return (
                              <CodeBlock
                                codeText={codeText}
                                language={match ? match[1] : "c"}
                              />
                            );
                          }

                          return (
                            <code
                              className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800/80 text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded font-semibold"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.text}
                    </Markdown>
                  </div>
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 px-1 font-mono uppercase tracking-wide">
                  {msg.role === "user" ? "You" : "AI"}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start max-w-[85%]" id="chat-typing-indicator">
                <div
                  className={`px-4 py-2.5 rounded-2xl rounded-bl-none text-xs font-medium ${
                    isDark ? "bg-zinc-900 border border-white/5 text-zinc-400" : "bg-zinc-100 border border-zinc-200/80 text-zinc-500"
                  }`}
                >
                  {language === "en" ? "AI is formulating answer..." : "এআই উত্তর তৈরি করছে..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div
            className={`px-4 py-2 flex flex-nowrap overflow-x-auto space-x-2 shrink-0 border-t border-b scrollbar-none ${
              isDark ? "bg-zinc-950/60 border-white/5" : "bg-zinc-50/60 border-zinc-100"
            }`}
            id="chat-quick-prompts"
          >
            {prompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                disabled={isTyping}
                className={`text-[10px] px-2.5 py-1.5 rounded-full border shrink-0 font-semibold cursor-pointer select-none active:scale-95 ${
                  isTyping
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                    ? "border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-white/20"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Form Footer */}
          <form
            onSubmit={handleFormSubmit}
            className={`p-3 shrink-0 flex items-center space-x-2 ${
              isDark ? "bg-zinc-900/40 border-t border-white/5" : "bg-zinc-50 border-t border-zinc-200"
            }`}
            id="chat-input-form"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={language === "en" ? "Ask anything in any language..." : "যেকোনো ভাষায় সাহায্য চান..."}
              disabled={isTyping}
              className={`flex-1 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 ${
                isDark 
                  ? "bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:ring-emerald-500" 
                  : "bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 focus:ring-blue-500"
              }`}
              id="chat-message-input"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className={`p-2 rounded-xl text-white cursor-pointer ${
                !inputMessage.trim() || isTyping
                  ? "bg-zinc-500/20 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-blue-600 active:scale-95"
              }`}
              id="send-msg-btn"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
