import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomSnapshot,
} from "../src/lib/types";
import { RoomStore } from "./rooms";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Tracks which room/slot a given socket currently occupies, so we can
// clean up correctly on disconnect without any external lookup.
const socketRoomMap = new Map<string, { code: string; slot: "a" | "b" }>();

export function registerSocketHandlers(io: AppServer) {
  io.on("connection", (socket: AppSocket) => {
    socket.on("room:join", ({ code }) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return;

      const slot = RoomStore.joinRoom(normalized, socket.id);

      if (!slot) {
        socket.emit("room:full");
        return;
      }

      socket.join(normalized);
      socketRoomMap.set(socket.id, { code: normalized, slot });

      const peer = RoomStore.getPeerOf(normalized, slot);

      const snapshot: RoomSnapshot = {
        code: normalized,
        slot,
        selfText: "",
        peerText: peer?.text ?? "",
        peerPresence: peer ? "online" : "disconnected",
        peerTyping: peer?.typing ?? false,
        roomFull: RoomStore.roomIsFull(normalized),
      };

      socket.emit("room:joined", snapshot);

      // Tell the peer (if present) that someone just came online.
      socket.to(normalized).emit("peer:presence", { presence: "online" });
    });

    socket.on("text:update", ({ code, text }) => {
      const entry = socketRoomMap.get(socket.id);
      if (!entry || entry.code !== code) return;

      RoomStore.setText(code, entry.slot, text);
      // Broadcast the raw current value — the client is the source of
      // truth for its own buffer, so we just relay, no diffing needed.
      socket.to(code).emit("peer:text", { text });
    });

    socket.on("typing:state", ({ code, typing }) => {
      const entry = socketRoomMap.get(socket.id);
      if (!entry || entry.code !== code) return;

      RoomStore.setTyping(code, entry.slot, typing);
      socket.to(code).emit("peer:typing", { typing });
    });

    socket.on("room:leave", ({ code }) => {
      cleanupSocket(socket, code);
    });

    socket.on("disconnect", () => {
      const entry = socketRoomMap.get(socket.id);
      if (entry) cleanupSocket(socket, entry.code);
    });
  });
}

function cleanupSocket(socket: AppSocket, code: string) {
  RoomStore.leaveRoom(code, socket.id);
  socketRoomMap.delete(socket.id);
  socket.to(code).emit("peer:presence", { presence: "disconnected" });
  socket.leave(code);
}
