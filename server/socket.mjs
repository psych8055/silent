import { RoomStore } from "./rooms.mjs";

const socketRoomMap = new Map();

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
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

      socket.emit("room:joined", {
        code: normalized,
        slot,
        selfText: "",
        peerText: peer?.text ?? "",
        peerPresence: peer ? "online" : "disconnected",
        peerTyping: peer?.typing ?? false,
        roomFull: RoomStore.roomIsFull(normalized),
      });

      socket.to(normalized).emit("peer:presence", { presence: "online" });
    });

    socket.on("text:update", ({ code, text }) => {
      const entry = socketRoomMap.get(socket.id);
      if (!entry || entry.code !== code) return;

      RoomStore.setText(code, entry.slot, text);
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

function cleanupSocket(socket, code) {
  RoomStore.leaveRoom(code, socket.id);
  socketRoomMap.delete(socket.id);
  socket.to(code).emit("peer:presence", { presence: "disconnected" });
  socket.leave(code);
}
