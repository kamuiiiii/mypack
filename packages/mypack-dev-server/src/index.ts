import express from "express";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

class Server {
  port: number;
  root: string;
  wss: WebSocketServer;
  constructor(port: number, root: string) {
    this.port = port;
    this.root = root;
  }

  start() {
    const app = express();
    app.use(express.static(path.resolve(this.root)));
    app.get("/", (req, res) => {
      res.sendFile("/index.html");
    });

    const server = createServer(app);
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", function (ws) {
      ws.send(`{ "type": "info", "text": "websocket connection" }`);
      console.log("websocket connection");

      ws.on("close", function () {
        console.log("websocket stop");
      });
    });

    server.listen(this.port, () => {
      console.log(`Listening on http://localhost:${this.port}`);
    });
  }

  reload() {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`{ "type": "reload" }`);
      }
    });
  }

  update(id: string) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`{ "type": "change", "id": "${id}" }`);
      }
    });
  }
}

export default Server;
