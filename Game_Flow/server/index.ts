import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, "..", "data");
const FLOW_FILE = path.join(DATA_DIR, "flow.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFlow(): { nodes: unknown[]; edges: unknown[] } | null {
  try {
    if (!fs.existsSync(FLOW_FILE)) return null;
    const raw = fs.readFileSync(FLOW_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data?.nodes) && Array.isArray(data?.edges)) {
      return { nodes: data.nodes, edges: data.edges };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeFlow(nodes: unknown[], edges: unknown[]) {
  ensureDataDir();
  fs.writeFileSync(
    FLOW_FILE,
    JSON.stringify({ nodes, edges, updatedAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  const wss = new WebSocketServer({ server });

  function broadcastFlow(nodes: unknown[], edges: unknown[]) {
    const payload = JSON.stringify({ type: "flow", nodes, edges });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(payload);
    });
  }

  wss.on("connection", (ws) => {
    const flow = readFlow();
    if (flow) ws.send(JSON.stringify({ type: "flow", nodes: flow.nodes, edges: flow.edges }));
  });

  app.use(express.json({ limit: "2mb" }));

  // API: загрузка и сохранение схемы
  app.get("/api/flow", (_req, res) => {
    const flow = readFlow();
    if (flow) {
      res.json(flow);
    } else {
      res.status(404).json({ error: "No saved flow" });
    }
  });

  app.put("/api/flow", (req, res) => {
    const { nodes, edges } = req.body || {};
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ error: "Expected { nodes, edges }" });
    }
    try {
      writeFlow(nodes, edges);
      broadcastFlow(nodes, edges);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  ensureDataDir();

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
