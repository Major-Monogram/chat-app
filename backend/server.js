const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

const app = express();

/* 🔹 Absolute path to frontend */
const FRONTEND_PATH = path.join(__dirname, "../frontend");

/* 🔹 Serve static files */
app.use(express.static(FRONTEND_PATH));

/* 🔹 Explicit root route */
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();
const LOG_FILE = path.join(__dirname, "chatlog.json");

let chatLog = [];
if (fs.existsSync(LOG_FILE)) {
  chatLog = JSON.parse(fs.readFileSync(LOG_FILE));
}

function saveLog() {
  fs.writeFileSync(LOG_FILE, JSON.stringify(chatLog, null, 2));
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const ws of clients.keys()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === "join") {
      let username = data.username?.trim();
      if (!username) return ws.close();

      if (ADMIN_SECRET && data.adminSecret === ADMIN_SECRET) {
        username = "ADMIN";
      }

      clients.set(ws, username);

      // Send old messages to newly joined user
      chatLog.forEach(m => ws.send(JSON.stringify(m)));

      broadcast({ username: "SYSTEM", message: `${username} joined` });
    }

    if (data.type === "message") {
      const user = clients.get(ws);
      if (!user) return;

      const entry = {
        username: user,
        message: data.message,
        time: new Date().toISOString()
      };

      chatLog.push(entry);
      saveLog();
      broadcast(entry);
    }
  });

  ws.on("close", () => {
    const user = clients.get(ws);
    clients.delete(ws);
    if (user) {
      broadcast({ username: "SYSTEM", message: `${user} left` });
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
