import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => Bun.file("src/index.html"))
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
