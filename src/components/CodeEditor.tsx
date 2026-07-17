import React, { useRef, useEffect, useState, useMemo } from "react";
import { CompileError, Theme, TextSize } from "../types";
import { TranslationType } from "../translations";

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  errors: CompileError[];
  theme: Theme;
  textSize: TextSize;
  t: TranslationType;
  autoBrackets: boolean;
  onCompile: () => void;
  isCompiling: boolean;
  onReset: () => void;
}

interface CompletionItem {
  text: string;
  type: "keyword" | "type" | "function" | "preprocessor" | "constant" | "variable";
}

const C_COMPLETION_ITEMS: CompletionItem[] = [
  { text: "printf", type: "function" },
  { text: "scanf", type: "function" },
  { text: "main", type: "function" },
  { text: "include", type: "preprocessor" },
  { text: "define", type: "preprocessor" },
  { text: "return", type: "keyword" },
  { text: "int", type: "type" },
  { text: "char", type: "type" },
  { text: "float", type: "type" },
  { text: "double", type: "type" },
  { text: "void", type: "type" },
  { text: "struct", type: "type" },
  { text: "if", type: "keyword" },
  { text: "else", type: "keyword" },
  { text: "for", type: "keyword" },
  { text: "while", type: "keyword" },
  { text: "switch", type: "keyword" },
  { text: "case", type: "keyword" },
  { text: "break", type: "keyword" },
  { text: "continue", type: "keyword" },
  { text: "sizeof", type: "keyword" },
  { text: "malloc", type: "function" },
  { text: "free", type: "function" },
  { text: "NULL", type: "constant" }
];

export default function CodeEditor({
  code,
  onChange,
  errors,
  theme,
  textSize,
  t,
  autoBrackets,
  onCompile,
  isCompiling,
  onReset,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const lines = code.split("\n");
  const lineCount = Math.max(lines.length, 1);

  // Autocomplete suggestions states
  const [suggestions, setSuggestions] = useState<CompletionItem[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionCoords, setSuggestionCoords] = useState({ top: 0, left: 0 });

  // Tokenize the C code with theme colors
  const tokenizedLines = useMemo(() => {
    const linesArr = code.split("\n");
    const result: { text: string; className: string }[][] = [];
    let inBlockComment = false;

    const isDark = theme === "dark";
    const colors = {
      preprocessor: isDark ? "text-amber-400 font-semibold" : "text-amber-600 font-semibold",
      keyword: isDark ? "text-blue-400 font-semibold" : "text-blue-600 font-semibold",
      type: isDark ? "text-emerald-400 font-semibold" : "text-emerald-600 font-semibold",
      control: isDark ? "text-purple-400 font-semibold" : "text-purple-600 font-semibold",
      string: isDark ? "text-orange-300" : "text-orange-600",
      comment: isDark ? "text-zinc-500 italic" : "text-zinc-400 italic",
      number: isDark ? "text-cyan-400" : "text-cyan-600",
      func: isDark ? "text-sky-400 font-medium" : "text-sky-600 font-medium",
      operator: isDark ? "text-pink-400" : "text-pink-600",
      text: isDark ? "text-zinc-100" : "text-zinc-900"
    };

    const types = new Set(["int", "char", "float", "double", "void", "struct", "union", "typedef", "const", "unsigned", "signed", "long", "short"]);
    const controls = new Set(["if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue", "return", "goto"]);
    const stdFuncs = new Set(["printf", "scanf", "main", "malloc", "free", "exit", "strlen", "strcmp", "strcpy", "pow", "sqrt", "abs"]);

    for (let lineIdx = 0; lineIdx < linesArr.length; lineIdx++) {
      const line = linesArr[lineIdx];
      const tokens: { text: string; className: string }[] = [];
      let i = 0;

      while (i < line.length) {
        if (inBlockComment) {
          let commentText = "";
          while (i < line.length) {
            if (line.startsWith("*/", i)) {
              commentText += "*/";
              i += 2;
              inBlockComment = false;
              break;
            }
            commentText += line[i];
            i++;
          }
          tokens.push({ text: commentText, className: colors.comment });
          continue;
        }

        if (line.startsWith("/*", i)) {
          let commentText = "/*";
          i += 2;
          inBlockComment = true;
          while (i < line.length) {
            if (line.startsWith("*/", i)) {
              commentText += "*/";
              i += 2;
              inBlockComment = false;
              break;
            }
            commentText += line[i];
            i++;
          }
          tokens.push({ text: commentText, className: colors.comment });
          continue;
        }

        if (line.startsWith("//", i)) {
          tokens.push({ text: line.substring(i), className: colors.comment });
          break;
        }

        if (line[i] === "#") {
          let prep = "#";
          i++;
          while (i < line.length && /[a-zA-Z]/.test(line[i])) {
            prep += line[i];
            i++;
          }
          tokens.push({ text: prep, className: colors.preprocessor });
          continue;
        }

        if (line[i] === '"') {
          let str = '"';
          i++;
          while (i < line.length) {
            if (line[i] === '"' && line[i - 1] !== '\\') {
              str += '"';
              i++;
              break;
            }
            str += line[i];
            i++;
          }
          tokens.push({ text: str, className: colors.string });
          continue;
        }

        if (line[i] === "'") {
          let ch = "'";
          i++;
          while (i < line.length) {
            if (line[i] === "'" && line[i - 1] !== '\\') {
              ch += "'";
              i++;
              break;
            }
            ch += line[i];
            i++;
          }
          tokens.push({ text: ch, className: colors.string });
          continue;
        }

        if (/\d/.test(line[i])) {
          let num = "";
          while (i < line.length && /[0-9xX_a-fA-F.]/.test(line[i])) {
            num += line[i];
            i++;
          }
          tokens.push({ text: num, className: colors.number });
          continue;
        }

        if (/[a-zA-Z_]/.test(line[i])) {
          let id = "";
          while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
            id += line[i];
            i++;
          }

          if (types.has(id)) {
            tokens.push({ text: id, className: colors.type });
          } else if (controls.has(id)) {
            tokens.push({ text: id, className: colors.control });
          } else if (stdFuncs.has(id)) {
            tokens.push({ text: id, className: colors.func });
          } else {
            let tempI = i;
            while (tempI < line.length && /\s/.test(line[tempI])) {
              tempI++;
            }
            if (tempI < line.length && line[tempI] === "(") {
              tokens.push({ text: id, className: colors.func });
            } else {
              tokens.push({ text: id, className: colors.text });
            }
          }
          continue;
        }

        if (/[-+*/%=<>!&|^~?:;.,[\]{}()]/.test(line[i])) {
          tokens.push({ text: line[i], className: colors.operator });
          i++;
          continue;
        }

        let spaces = "";
        while (i < line.length && /\s/.test(line[i])) {
          spaces += line[i];
          i++;
        }
        if (spaces) {
          tokens.push({ text: spaces, className: colors.text });
        } else {
          tokens.push({ text: line[i], className: colors.text });
          i++;
        }
      }
      result.push(tokens);
    }

    return result;
  }, [code, theme]);

  // Extract variables defined in the code
  const extractVariables = (cCode: string): string[] => {
    const vars = new Set<string>();
    const regex = /\b(int|float|double|char|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = regex.exec(cCode)) !== null) {
      if (match[2]) {
        vars.add(match[2]);
      }
    }
    return Array.from(vars);
  };

  // Synchronize scrolling of line gutter and syntax overlay
  const handleScroll = () => {
    if (textareaRef.current) {
      if (gutterRef.current) {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  // Compute cursor coordinate for autocompletion
  const getCaretPos = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };
    const start = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, start);
    const linesBefore = textBefore.split("\n");
    const currentLineIdx = linesBefore.length - 1;
    const currentColIdx = linesBefore[currentLineIdx].length;

    let charWidth = 8.5; 
    let lineHeight = 24; 

    if (textSize === "sm") {
      charWidth = 7.2;
    } else if (textSize === "lg") {
      charWidth = 9.6;
    } else if (textSize === "xl") {
      charWidth = 10.8;
    }

    const scrollTop = textareaRef.current.scrollTop;
    const scrollLeft = textareaRef.current.scrollLeft;

    // Relative to the wrapper container
    const top = (currentLineIdx * lineHeight) + 20 - scrollTop; 
    const left = (currentColIdx * charWidth) + 16 - scrollLeft; 

    return { top, left };
  };

  // Update suggestions dropdown
  const updateSuggestions = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, start);

    const words = textBefore.split(/[^a-zA-Z0-9_#]/);
    const currentWord = words[words.length - 1];

    if (!currentWord || currentWord.length < 1) {
      setShowSuggestions(false);
      return;
    }

    const userVars = extractVariables(code);
    const varItems: CompletionItem[] = userVars.map(v => ({ text: v, type: "variable" }));
    const allCandidates = [...varItems, ...C_COMPLETION_ITEMS];

    const currentWordLower = currentWord.toLowerCase();
    const filtered = allCandidates.filter(item => 
      item.text.toLowerCase().startsWith(currentWordLower) && 
      item.text.toLowerCase() !== currentWordLower
    );

    // Filter unique texts
    const uniqueMap = new Map<string, CompletionItem>();
    filtered.forEach(item => uniqueMap.set(item.text, item));
    const uniqueFiltered = Array.from(uniqueMap.values()).slice(0, 5);

    if (uniqueFiltered.length > 0) {
      setSuggestions(uniqueFiltered);
      setSuggestionIndex(0);
      setShowSuggestions(true);

      const pos = getCaretPos();
      // Ensure suggestion panel does not overflow client screen size
      const boundedTop = Math.max(10, Math.min(pos.top, (textareaRef.current?.clientHeight ?? 400) - 160));
      const boundedLeft = Math.max(10, Math.min(pos.left, (textareaRef.current?.clientWidth ?? 600) - 180));
      setSuggestionCoords({ top: boundedTop, left: boundedLeft });
    } else {
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, start);
    const textAfter = code.substring(start);

    const words = textBefore.split(/[^a-zA-Z0-9_#]/);
    const currentWord = words[words.length - 1];

    const replaceStart = start - currentWord.length;
    const newValue = code.substring(0, replaceStart) + suggestion + textAfter;
    onChange(newValue);
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = replaceStart + suggestion.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If autocomplete suggestions list is open, redirect keys
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex].text);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Bypass inserting closing brackets/quotes if already right in front of them
    if (autoBrackets && textareaRef.current) {
      const pos = textareaRef.current.selectionStart;
      const nextChar = code[pos];
      if ((e.key === "}" || e.key === ")" || e.key === "]" || e.key === '"' || e.key === "'") && nextChar === e.key) {
        e.preventDefault();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos + 1;
        return;
      }
    }

    // Handle Tab Indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (!autoBrackets) return;
    const inputType = (e.nativeEvent as any).inputType;
    const data = (e.nativeEvent as any).data;

    if (inputType === "insertText" && data) {
      const pairs: { [key: string]: string } = {
        "{": "}",
        "(": ")",
        "[": "]",
        '"': '"',
        "'": "'",
      };

      if (pairs[data] !== undefined) {
        e.preventDefault();
        const char = data;
        const closeChar = pairs[char];
        const start = textareaRef.current?.selectionStart ?? 0;
        const end = textareaRef.current?.selectionEnd ?? 0;
        const value = code;
        const newValue = value.substring(0, start) + char + closeChar + value.substring(end);
        onChange(newValue);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      }
    }
  };

  const handleSelect = () => {
    // Check suggestions on selection move or typing
    setTimeout(() => {
      updateSuggestions();
    }, 10);
  };

  useEffect(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [code]);

  const fontSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const fontSizeClass = fontSizes[textSize] || "text-sm";

  const getLineStatus = (lineNum: number) => {
    const lineErrors = errors.filter((err) => err.line === lineNum);
    if (lineErrors.length === 0) return null;
    const hasError = lineErrors.some((err) => err.type === "error");
    return hasError ? "error" : "warning";
  };

  const getLineErrors = (lineNum: number) => {
    return errors.filter((err) => err.line === lineNum);
  };

  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-black text-white" : "bg-white text-black"}`} id="editor-container">
      {/* Editor Header / Toolbars */}
      <div className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${isDark ? "border-white/10 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`} id="editor-header">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">MAIN.C</span>
          {errors.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 font-mono uppercase tracking-widest font-semibold ${
              errors.some(e => e.type === 'error') 
                ? "bg-red-500 text-white" 
                : "bg-zinc-800 text-zinc-300"
            }`}>
              {errors.length} {errors.length === 1 ? "issue" : "issues"}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onReset}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              isDark 
                ? "border-white/10 hover:bg-zinc-900 text-zinc-300" 
                : "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
            }`}
            id="btn-reset-code"
          >
            {t.resetBtn}
          </button>
          <button
            onClick={onCompile}
            disabled={isCompiling}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              isCompiling
                ? "opacity-50 cursor-not-allowed"
                : isDark
                ? "bg-white text-black border-white hover:bg-neutral-200"
                : "bg-black text-white border-black hover:bg-neutral-800"
            }`}
            id="btn-compile-run"
          >
            {isCompiling ? t.compiling : t.compileButton}
          </button>
        </div>
      </div>

      {/* Editor Gutter + Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative" id="editor-workspace">
        {/* Line Numbers Column */}
        <div
          ref={gutterRef}
          className={`w-12 select-none overflow-hidden text-right pr-4 py-4 font-mono text-xs leading-6 border-r ${
            isDark ? "bg-zinc-950 text-zinc-700 border-white/5" : "bg-zinc-50 text-zinc-400 border-zinc-100"
          }`}
          id="editor-gutter"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const status = getLineStatus(lineNum);
            const lineErrors = getLineErrors(lineNum);

            return (
              <div 
                key={lineNum} 
                className={`relative group h-6 pr-1 ${
                  status === "error" 
                    ? "text-red-500 font-bold bg-red-950/20" 
                    : status === "warning" 
                    ? "text-amber-500 font-bold bg-amber-950/10" 
                    : ""
                }`}
              >
                {lineNum}
                {status && (
                  <div className={`absolute top-1.5 left-1 w-1.5 h-1.5 rounded-full ${
                    status === "error" ? "bg-red-500" : "bg-amber-500"
                  }`} />
                )}

                {/* Gutter issue description tooltip */}
                {lineErrors.length > 0 && (
                  <div className={`absolute left-10 top-0 hidden group-hover:block z-30 max-w-xs p-2.5 font-sans text-left text-xs rounded shadow-lg ${
                    isDark ? "bg-zinc-900 text-white border border-white/10" : "bg-white text-black border border-zinc-200"
                  }`}>
                    {lineErrors.map((err, idx) => (
                      <div key={idx} className="mb-1 last:mb-0">
                        <span className="font-semibold uppercase text-[10px] tracking-tight mr-1 text-red-500">
                          {err.type}:
                        </span>
                        {err.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Textarea & Highlights overlay absolute container */}
        <div className="flex-1 relative h-full overflow-hidden" id="editor-textarea-wrapper">
          {/* 1. Transparent-Input Highlighted Syntax Underlay */}
          <div
            ref={highlightRef}
            className={`absolute inset-0 w-full h-full p-4 font-mono leading-6 whitespace-pre overflow-hidden pointer-events-none select-none ${fontSizeClass} ${
              isDark ? "bg-black" : "bg-white"
            }`}
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {tokenizedLines.map((lineTokens, lineIdx) => (
              <div key={lineIdx} className="h-6">
                {lineTokens.map((t, tIdx) => (
                  <span key={tIdx} className={t.className}>{t.text}</span>
                ))}
                {lineTokens.length === 0 && "\u200B"}
              </div>
            ))}
          </div>

          {/* 2. Interactive Invisible-text Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value);
              setTimeout(() => updateSuggestions(), 10);
            }}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onInput={handleBeforeInput}
            onSelect={handleSelect}
            className={`absolute inset-0 w-full h-full p-4 font-mono leading-6 resize-none focus:outline-none overflow-auto bg-transparent whitespace-pre ${fontSizeClass}`}
            style={{
              color: 'transparent',
              caretColor: isDark ? '#ffffff' : '#000000',
              fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
              WebkitTextFillColor: 'transparent',
            }}
            placeholder={t.editorPlaceholder}
            spellCheck="false"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            id="editor-textarea"
          />

          {/* 3. Floating Variables & Keywords Autocomplete Box */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className={`absolute z-40 w-48 rounded-lg border shadow-2xl p-1 font-sans ${
                isDark ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"
              }`}
              style={{
                top: `${suggestionCoords.top}px`,
                left: `${suggestionCoords.left}px`,
              }}
              id="editor-autocomplete-dropdown"
            >
              {suggestions.map((item, index) => {
                const isActive = index === suggestionIndex;
                const badgeColor = 
                  item.type === "variable" ? "text-blue-500" :
                  item.type === "function" ? "text-sky-500" :
                  item.type === "type" ? "text-emerald-500" :
                  item.type === "keyword" ? "text-purple-500" :
                  item.type === "preprocessor" ? "text-amber-500" : "text-zinc-500";
                
                const typeLabel = 
                  item.type === "variable" ? "var" :
                  item.type === "function" ? "fn" :
                  item.type === "type" ? "type" :
                  item.type === "keyword" ? "kw" :
                  item.type === "preprocessor" ? "prep" : "val";

                return (
                  <button
                    key={item.text}
                    onClick={() => insertSuggestion(item.text)}
                    className={`flex items-center justify-between w-full text-left px-2 py-1.5 text-xs rounded transition-colors cursor-pointer font-medium ${
                      isActive 
                        ? isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-950" 
                        : isDark ? "hover:bg-zinc-900 text-zinc-300" : "hover:bg-zinc-50 text-zinc-700"
                    }`}
                  >
                    <span className="font-mono text-xs">{item.text}</span>
                    <span className={`text-[8px] uppercase tracking-wider font-bold ${badgeColor}`}>
                      {typeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Floating issue warning overlay */}
          {errors.length > 0 && (
            <div className="absolute top-2 right-4 z-10 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
              <span className="text-[9px] uppercase tracking-widest font-mono px-2 py-1 bg-red-950/40 text-red-400 border border-red-900/50">
                {errors.filter(e => e.type === 'error').length} compilation errors
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
