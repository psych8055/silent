import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || (dev ? "localhost" : "0.0.0.0");
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: "*" },
  });

  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Silent is listening on http://${hostname}:${port}`);
  });
});
