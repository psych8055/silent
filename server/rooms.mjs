const rooms = new Map();

function emptyPeer(socketId) {
  return { socketId, text: "", typing: false, connected: true };
}

function getOrCreateRoom(code) {
  let room = rooms.get(code);
  if (!room) {
    room = { code, a: null, b: null, createdAt: Date.now() };
    rooms.set(code, room);
  }
  return room;
}

function otherSlot(slot) {
  return slot === "a" ? "b" : "a";
}

function joinRoom(code, socketId) {
  const room = getOrCreateRoom(code);

  if (room.a?.socketId === socketId) return "a";
  if (room.b?.socketId === socketId) return "b";

  if (!room.a) {
    room.a = emptyPeer(socketId);
    return "a";
  }
  if (!room.b) {
    room.b = emptyPeer(socketId);
    return "b";
  }
  return null;
}

function leaveRoom(code, socketId) {
  const room = rooms.get(code);
  if (!room) return;

  if (room.a?.socketId === socketId) room.a = null;
  if (room.b?.socketId === socketId) room.b = null;

  if (!room.a && !room.b) rooms.delete(code);
}

function setText(code, slot, text) {
  const room = rooms.get(code);
  if (!room) return;
  const peer = room[slot];
  if (peer) peer.text = text;
}

function setTyping(code, slot, typing) {
  const room = rooms.get(code);
  if (!room) return;
  const peer = room[slot];
  if (peer) peer.typing = typing;
}

function getPeerOf(code, slot) {
  const room = rooms.get(code);
  if (!room) return null;
  return room[otherSlot(slot)];
}

function roomIsFull(code) {
  const room = rooms.get(code);
  if (!room) return false;
  return Boolean(room.a && room.b);
}

export const RoomStore = {
  joinRoom,
  leaveRoom,
  setText,
  setTyping,
  getPeerOf,
  roomIsFull,
};
