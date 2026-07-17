import express from "express";
import path from "path";
import dotenv from "dotenv";
import app from "./src/api-server";

dotenv.config();

async function startServer() {
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Only start the local listener if NOT deploying as a Vercel Serverless Function
if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
