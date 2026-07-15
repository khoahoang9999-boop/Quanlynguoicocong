import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON parser with high limit for large datasets
  app.use(express.json({ limit: '50mb' }));

  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const DATA_FILE_PATH = path.join(DATA_DIR, 'nguoi_co_cong_data.json');
  const SETTINGS_FILE_PATH = path.join(DATA_DIR, 'settings.json');

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/data", (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return res.json({ exists: true, data: parsed });
      }
      return res.json({ exists: false, data: [] });
    } catch (err: any) {
      console.error("Error reading data file:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/data", (req, res) => {
    try {
      const { data } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid data format. Expected an array." });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Error writing data file:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/settings", (req, res) => {
    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const fileContent = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return res.json(parsed);
      }
      return res.json({ sheetUrl: "", defaultYear: "" });
    } catch (err: any) {
      console.error("Error reading settings file:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const { sheetUrl, defaultYear } = req.body;
      let currentSettings = { sheetUrl: "", defaultYear: "" };
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        try {
          currentSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8'));
        } catch (e) {}
      }
      if (sheetUrl !== undefined) currentSettings.sheetUrl = sheetUrl;
      if (defaultYear !== undefined) currentSettings.defaultYear = defaultYear;

      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(currentSettings, null, 2), 'utf-8');
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Error writing settings file:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
