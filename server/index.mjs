import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket.mjs";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || (dev ? "localhost" : "0.0.0.0");
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      if (req.url === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            server: "silent-custom-next-socketio",
          })
        );
        return;
      }

      handle(req, res);
    });

    const io = new Server(httpServer, {
      path: "/api/socket",
      cors: { origin: "*" },
    });

    registerSocketHandlers(io);

    httpServer.on("error", (error) => {
      console.error("Silent server failed to start:", error);
      process.exit(1);
    });

    httpServer.listen(port, () => {
      console.log(`> Silent is listening on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Silent failed during Next.js preparation:", error);
    process.exit(1);
  });
