export interface CompileError {
  line: number;
  column?: number;
  message: string;
  type: "error" | "warning";
}

export interface CompileResult {
  success: boolean;
  errors: CompileError[];
  output: string;
}

export type Theme = "dark" | "light";
export type TextSize = "sm" | "md" | "lg" | "xl";
export type Language = "en" | "bn";

export type TabType = "code" | "output" | "info" | "settings";

export interface AppSettings {
  theme: Theme;
  textSize: TextSize;
  language: Language;
}
