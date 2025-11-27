import { Elysia } from "elysia";
import { Database } from "bun:sqlite";
import path from "path";

const dbPath = path.join(process.cwd(), "DataBase", "db.sqlite");
const db = new Database(dbPath);

const app = new Elysia()
  .get("/", () => Bun.file("src/index.html"))
  .get("/api/tables", () => {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all();
    console.log("Tables:", tables);
    return tables;
  })
  .get("/api/table/:name", ({ params }) => {
    const { name } = params;
    try {
      const dataQuery = db.query(`SELECT * FROM ${name}`);
      const data = dataQuery.all();
      
      const schemaQuery = db.query(`PRAGMA table_info(${name})`);
      const schema = schemaQuery.all();
      
      console.log(`Table ${name}:`, { schema, data });
      return { schema, data };
    } catch (error: any) {
      console.error("Error loading table:", error);
      return { error: error.message || 'Table not found' };
    }
  })
  .ws("/ws", {
    message(ws, message) {
      console.log("Received from client:", message);
      
      // Broadcast the message to all connected clients as client message
      ws.publish("chat", JSON.stringify({
        type: 'client',
        message,
        timestamp: new Date().toISOString()
      }));
    },
    open(ws) {
      console.log("Client connected");
      ws.subscribe("chat");
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'system',
        message: "Connected to WebSocket server",
        timestamp: new Date().toISOString()
      }));
    },
    close(ws) {
      console.log("Client disconnected");
      ws.unsubscribe("chat");
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`WebSocket endpoint: ws://${app.server?.hostname}:${app.server?.port}/ws`);
