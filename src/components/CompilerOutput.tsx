import React from "react";
import { CompileError, Theme, TextSize } from "../types";
import { TranslationType } from "../translations";

interface CompilerOutputProps {
  output: string;
  errors: CompileError[];
  success: boolean;
  hasRun: boolean;
  stdin: string;
  onStdinChange: (val: string) => void;
  theme: Theme;
  textSize: TextSize;
  t: TranslationType;
  onCompile: () => void;
  isCompiling: boolean;
  code: string;
}

export default function CompilerOutput({
  output,
  errors,
  success,
  hasRun,
  stdin,
  onStdinChange,
  theme,
  textSize,
  t,
  onCompile,
  isCompiling,
  code,
}: CompilerOutputProps) {
  const isDark = theme === "dark";

  // Text size mappings
  const fontSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const fontSizeClass = fontSizes[textSize] || "text-sm";
  const numErrors = errors.filter((e) => e.type === "error").length;
  const numWarnings = errors.filter((e) => e.type === "warning").length;

  const codeLines = code.split("\n");

  // Dynamic input-taking detection
  const requests = React.useMemo(() => {
    const lines = code.split("\n");
    const found: { id: string; label: string; placeholder: string; line: number }[] = [];
    let inputCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      // Clean single-line and multi-line comments to avoid false positives
      const textClean = lineText.replace(/\/\/.*$/, "").replace(/\/\*[\s\S]*?\*\//g, "");

      // 1. Detect scanf
      const scanfRegex = /scanf\s*\(\s*"([^"]*)"/g;
      let scanfMatch;
      while ((scanfMatch = scanfRegex.exec(textClean)) !== null) {
        const formatStr = scanfMatch[1];
        const specifiers = formatStr.match(/%[0-9]*[a-zA-Z]+/g) || [];
        for (const spec of specifiers) {
          if (spec === "%") continue;
          inputCount++;
          found.push({
            id: `input-${inputCount}`,
            label: `Input ${inputCount} (${spec})`,
            placeholder: `Value for ${spec} at line ${i + 1}`,
            line: i + 1,
          });
        }
      }

      // 2. Detect getchar
      const getcharRegex = /getchar\s*\(\s*\)/g;
      if (getcharRegex.test(textClean)) {
        inputCount++;
        found.push({
          id: `input-${inputCount}`,
          label: `Input ${inputCount} (getchar)`,
          placeholder: `Char at line ${i + 1}`,
          line: i + 1,
        });
      }

      // 3. Detect gets
      const getsRegex = /gets\s*\(/g;
      if (getsRegex.test(textClean) && !textClean.includes("fgets")) {
        inputCount++;
        found.push({
          id: `input-${inputCount}`,
          label: `Input ${inputCount} (gets)`,
          placeholder: `Line of text at line ${i + 1}`,
          line: i + 1,
        });
      }

      // 4. Detect fgets with stdin
      const fgetsRegex = /fgets\s*\([^,]+,\s*[^,]+,\s*stdin\s*\)/g;
      if (fgetsRegex.test(textClean)) {
        inputCount++;
        found.push({
          id: `input-${inputCount}`,
          label: `Input ${inputCount} (fgets)`,
          placeholder: `Line of text at line ${i + 1}`,
          line: i + 1,
        });
      }
    }
    return found;
  }, [code]);

  // Stdin Synchronization state
  const [localInputs, setLocalInputs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const values = stdin.split("\n");
    const initial: Record<string, string> = {};
    requests.forEach((req, idx) => {
      initial[req.id] = values[idx] || "";
    });
    setLocalInputs(initial);
  }, [requests, stdin]);

  return (
    <div className={`flex flex-col h-full overflow-y-auto p-6 ${isDark ? "bg-black text-white" : "bg-white text-black"}`} id="output-container">
      {/* 2-Column Desktop, Stacked Mobile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0" id="output-grid">
        {/* Left Column: Output & Terminal + Dynamic Inputs (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4" id="stdout-section">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
              {t.stdoutLabel}
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCompile}
                disabled={isCompiling}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer select-none ${
                  isCompiling
                    ? "opacity-55 cursor-not-allowed"
                    : isDark
                    ? "bg-white text-black border-white hover:bg-neutral-200"
                    : "bg-black text-white border-black hover:bg-neutral-800"
                }`}
                id="btn-run-output"
              >
                {isCompiling ? t.compiling : t.compileButton}
              </button>
              {hasRun && (
                <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                  success 
                    ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black") 
                    : "border-red-500/50 text-red-400"
                }`}>
                  {success ? "Success" : "Failed"}
                </span>
              )}
            </div>
          </div>

          {/* Terminal Box */}
          <div
            className={`flex-1 min-h-[250px] p-4 font-mono leading-relaxed border whitespace-pre-wrap overflow-y-auto ${fontSizeClass} ${
              isDark 
                ? "bg-zinc-950 text-zinc-300 border-white/10" 
                : "bg-zinc-50 text-zinc-800 border-zinc-200"
            }`}
            id="stdout-terminal"
          >
            {isCompiling ? (
              <div className="space-y-1 text-xs font-mono text-zinc-400 select-none">
                <div className="text-zinc-500">$ gcc -O2 main.c -o main -lm</div>
                <div className="text-emerald-500 font-bold uppercase tracking-wider mb-2">
                  [GCC] Compiling source code line by line:
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-0.5 border border-zinc-200 dark:border-white/10 p-3 bg-zinc-100/40 dark:bg-black/40 rounded">
                  {codeLines.map((line, idx) => (
                    <div key={idx} className="flex text-[11px] font-mono leading-5">
                      <span className="text-zinc-500 dark:text-zinc-600 w-10 text-right pr-2 shrink-0">{idx + 1} |</span>
                      <span className="text-zinc-700 dark:text-zinc-300 truncate">{line || " "}</span>
                      <span className="ml-auto text-[9px] text-emerald-600 dark:text-emerald-500 font-bold uppercase shrink-0">OK</span>
                    </div>
                  ))}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 mt-2">[GCC] Linking objects and generating ELF executable...</div>
              </div>
            ) : !hasRun ? (
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">{t.noOutputYet}</span>
            ) : output ? (
              output
            ) : success ? (
              <span className="text-zinc-600 dark:text-zinc-300 font-mono text-xs font-semibold">[Program exited normally with 0 return code]</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-mono text-xs font-semibold">[Compilation/execution failed with errors]</span>
            )}
          </div>

          {/* Dynamic input boxes shown only when taking input */}
          {requests.length > 0 && (
            <div className={`p-4 border rounded-lg ${isDark ? "bg-zinc-950 border-white/10" : "bg-zinc-50 border-zinc-200"}`} id="dynamic-inputs-panel">
              <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Program Inputs Required:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {requests.map((req, idx) => (
                  <div key={req.id} className="flex flex-col space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500" htmlFor={req.id}>
                      {req.label}
                    </label>
                    <input
                      id={req.id}
                      type="text"
                      value={localInputs[req.id] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { ...localInputs, [req.id]: val };
                        setLocalInputs(updated);
                        const joined = requests.map(r => updated[r.id] || "").join("\n");
                        onStdinChange(joined);
                      }}
                      className={`px-3 py-1.5 font-mono text-xs border rounded focus:outline-none ${
                        isDark 
                          ? "bg-black text-white border-white/10 focus:border-white/30" 
                          : "bg-white text-black border-zinc-200 focus:border-black"
                      }`}
                      placeholder={req.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4" id="diagnostics-panel-column">
          {/* Compilation Diagnostics Panel */}
          <div className="flex-1 flex flex-col space-y-2" id="diagnostics-panel">
            <h2 className="text-[10px] font-bold font-mono tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
              {t.compilationStatus}
            </h2>

            <div
              className={`flex-1 border p-4 overflow-y-auto space-y-3 ${
                isDark ? "border-white/10 bg-zinc-950" : "border-zinc-200 bg-zinc-50"
              }`}
              id="diagnostics-list"
            >
              {!hasRun ? (
                <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">No analysis available.</div>
              ) : errors.length === 0 ? (
                <div className="text-xs font-mono flex flex-col space-y-2" id="success-diagnostics">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                    <span className="text-sm">✓</span>
                    <span>0 COMPILATION ERRORS</span>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-200 text-[11px] leading-relaxed font-sans">
                    {t.successMsg}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs font-mono font-semibold border-b pb-2 flex justify-between border-white/5">
                    <span className="text-red-500 font-bold uppercase tracking-wider">{numErrors} Errors</span>
                    <span className="text-amber-500 font-bold uppercase tracking-wider">{numWarnings} Warnings</span>
                  </div>

                  {errors.map((err, idx) => {
                    const lineSnippet = codeLines[err.line - 1];

                    return (
                      <div
                        key={idx}
                        className={`text-xs border-l pl-3 py-1.5 space-y-1.5 ${
                          err.type === "error" 
                            ? "border-red-500" 
                            : "border-amber-500"
                        }`}
                        id={`diag-item-${idx}`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className={`font-bold uppercase tracking-wider text-[9px] ${
                            err.type === "error" ? "text-red-500" : "text-amber-500"
                          }`}>
                            {err.type}
                          </span>
                          <span className="opacity-50 text-[9px] font-mono">
                            {t.errorLine} {err.line} {err.column ? `, ${t.errorCol} ${err.column}` : ""}
                          </span>
                        </div>
                        <p className={`font-sans leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
                          {err.message}
                        </p>

                        {/* Show exact code snippet */}
                        {lineSnippet !== undefined && (
                          <div className={`mt-2 p-2 font-mono text-[11px] overflow-x-auto ${
                            isDark ? "bg-black text-zinc-400 border border-white/5" : "bg-white text-zinc-800 border border-zinc-100"
                          }`}>
                            <div className="text-[9px] opacity-40 uppercase tracking-widest mb-1">Code line {err.line}:</div>
                            <span className="opacity-40 select-none mr-2">{err.line} |</span>
                            <span>{lineSnippet || " "}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
