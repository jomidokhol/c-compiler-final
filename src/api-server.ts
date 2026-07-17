import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import { exec, spawn } from "child_process";

dotenv.config();

// Helper to parse GCC stderr output for errors and warnings
function parseGccErrors(stderr: string): any[] {
  const errors: any[] = [];
  if (!stderr) return errors;

  const lines = stderr.split("\n");
  // Match standard GCC format like /tmp/code_abcdef123456.c:5:10: error: 'x' undeclared
  const regexWithCol = /\/tmp\/code_[a-f0-9]+\.c:(\d+):(\d+):\s+(error|warning):\s+(.*)/i;
  const regexNoCol = /\/tmp\/code_[a-f0-9]+\.c:(\d+):\s+(error|warning):\s+(.*)/i;

  for (const line of lines) {
    let match = line.match(regexWithCol);
    if (match) {
      errors.push({
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10),
        type: match[3].toLowerCase() as "error" | "warning",
        message: match[4].trim()
      });
    } else {
      match = line.match(regexNoCol);
      if (match) {
        errors.push({
          line: parseInt(match[1], 10),
          type: match[2].toLowerCase() as "error" | "warning",
          message: match[3].trim()
        });
      }
    }
  }
  return errors;
}

// Helper to run compiled binary with timeout and stdin feeding
function runBinary(execPath: string, inputData: string, timeoutMs = 5000): Promise<{ code: number | null; stdout: string; stderr: string; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn(execPath);
    let stdout = "";
    let stderr = "";
    let timer: NodeJS.Timeout | null = null;
    let finished = false;

    timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        child.kill("SIGKILL");
        resolve({
          code: null,
          stdout,
          stderr: stderr + "\n[Execution Timed Out (Limit: 5s)]",
          error: "Timeout"
        });
      }
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (!finished) {
        finished = true;
        if (timer) clearTimeout(timer);
        resolve({ code, stdout, stderr });
      }
    });

    child.on("error", (err) => {
      if (!finished) {
        finished = true;
        if (timer) clearTimeout(timer);
        resolve({
          code: null,
          stdout,
          stderr: stderr + `\n[Process Error: ${err.message}]`,
          error: err.message
        });
      }
    });

    if (inputData) {
      try {
        child.stdin.write(inputData);
      } catch (e) {
        // stdin stream might be closed if program doesn't read it
      }
    }
    try {
      child.stdin.end();
    } catch (e) {}
  });
}

const app = express();
app.use(express.json());

// API Route for Compile (Real GCC Compiler Execution)
app.post("/api/compile", async (req, res) => {
  const { code, input } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  // Pre-check: Verify if native GCC compiler exists on the host
  exec("which gcc", (gccCheckErr) => {
    if (gccCheckErr) {
      return res.json({
        success: false,
        errors: [{
          line: 1,
          message: "GCC compiler is not available on this server.",
          type: "error"
        }],
        output: "Error: GCC compiler was not found on this hosting environment.\n\n👉 Vercel Serverless runs in a highly restricted, read-only Lambda container and does NOT support GCC or compiling native C binaries natively.\n\n👉 Recommendation: If you are deploying to Vercel, the frontend & AI Chat will work perfectly! However, to run C code, you should host this application on a containerized or server-based environment like Railway, Render, Koyeb, Fly.io, or any standard VPS where GCC is preinstalled."
      });
    }

    const id = crypto.randomBytes(8).toString("hex");
    const srcFile = `/tmp/code_${id}.c`;
    const execFile = `/tmp/code_${id}`;

    try {
      // Write user code to temporary file
      fs.writeFileSync(srcFile, code, "utf8");

      // Compile code using native GCC (including the math library -lm)
      const compileCmd = `gcc -O2 ${srcFile} -o ${execFile} -lm`;
      
      exec(compileCmd, { timeout: 5000 }, async (err, stdout, stderr) => {
        const compileErrors = parseGccErrors(stderr);
        const success = !err; // Compilation successful if exit code is 0

        if (!success) {
          // Compilation failed
          try { fs.unlinkSync(srcFile); } catch {}
          try { fs.unlinkSync(execFile); } catch {}
          
          return res.json({
            success: false,
            errors: compileErrors.length > 0 ? compileErrors : [{ line: 1, message: stderr || "Compilation failed", type: "error" }],
            output: stderr || "Compilation failed with unknown error"
          });
        }

        // Compilation succeeded, execute the binary
        const runResult = await runBinary(execFile, input || "");

        // Clean up temporary files
        try { fs.unlinkSync(srcFile); } catch {}
        try { fs.unlinkSync(execFile); } catch {}

        res.json({
          success: true,
          errors: compileErrors, // Include warnings if any
          output: runResult.stdout + (runResult.stderr ? "\n" + runResult.stderr : "")
        });
      });

    } catch (err: any) {
      console.error("Compilation error:", err);
      // Clean up in case of crash
      try { fs.unlinkSync(srcFile); } catch {}
      try { fs.unlinkSync(execFile); } catch {}
      
      res.status(500).json({
        error: err.message || "Internal server error during compilation."
      });
    }
  });
});

// API Route for AI Assist Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, code, input } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are a helpful, expert C programming tutor and AI assistant integrated into c-compiler.io (created by Nur Muhammad).
The user is working on the following C code in their workspace:
\`\`\`c
${code || "/* No code yet */"}
\`\`\`

Standard Input (stdin) is currently set to:
\`\`\`
${input || "/* No input */"}
\`\`\`

Analyze the user's input and reply appropriately in their language (e.g., Bengali, English, etc.).
If they ask to check for mistakes, look at their C code carefully, find any semantic or syntax issues, tell them exactly where they are (line/function), and explain how to solve them clearly.
If they ask you to perform small tasks (like explaining a concept, writing a short function, or modifying something), do it in a clear and friendly manner. Keep your response clear and well-formatted with markdown.`;

    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text || msg.content || "" }]
    }));

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.1-pro-preview"];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      let retries = 5;
      let delay = 800;
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
            }
          });
          if (response) {
            break;
          }
        } catch (err: any) {
          const isRateLimit = err.status === "RESOURCE_EXHAUSTED" || 
                              err.code === 429 || 
                              (err.message && (
                                err.message.includes("429") || 
                                err.message.includes("quota") || 
                                err.message.includes("RESOURCE_EXHAUSTED")
                              ));
          const isTemporary = !isRateLimit && (
                              err.status === "UNAVAILABLE" || 
                              err.code === 503 || 
                              (err.message && (
                                err.message.includes("503") || 
                                err.message.includes("demand") || 
                                err.message.includes("temporary") ||
                                err.message.includes("UNAVAILABLE")
                              )));
          if (isTemporary && attempt < retries) {
            const jitter = Math.random() * 200;
            const actualDelay = delay + jitter;
            await new Promise(resolve => setTimeout(resolve, actualDelay));
            delay = Math.min(delay * 2, 8000);
          } else {
            lastError = err;
            break;
          }
        }
      }
      if (response) {
        break;
      }
    }

    if (!response) {
      throw lastError || new Error("All chat fallback models failed.");
    }

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Internal server error during chat." });
  }
});

export default app;
