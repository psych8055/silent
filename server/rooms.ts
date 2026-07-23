import type { PeerSlot } from "../src/lib/types";

/**
 * A room's entire existence is this object, living only in process memory.
 * Nothing here is ever written to disk, a database, or a cache. The moment
 * both slots are empty, the room is deleted and its text is unrecoverable.
 */
interface Peer {
  socketId: string;
  text: string;
  typing: boolean;
  connected: boolean;
}

interface Room {
  code: string;
  a: Peer | null;
  b: Peer | null;
  createdAt: number;
}

const rooms = new Map<string, Room>();

function emptyPeer(socketId: string): Peer {
  return { socketId, text: "", typing: false, connected: true };
}

function getOrCreateRoom(code: string): Room {
  let room = rooms.get(code);
  if (!room) {
    room = { code, a: null, b: null, createdAt: Date.now() };
    rooms.set(code, room);
  }
  return room;
}

function otherSlot(slot: PeerSlot): PeerSlot {
  return slot === "a" ? "b" : "a";
}

/**
 * Attempts to seat a socket into a room. Returns the assigned slot, or
 * null if the room already has two occupants.
 */
function joinRoom(code: string, socketId: string): PeerSlot | null {
  const room = getOrCreateRoom(code);

  // Reconnect logic isn't needed by design — a refresh is a clean slate —
  // but if this exact socket somehow already holds a slot, keep it stable.
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
  return null; // room full
}

function leaveRoom(code: string, socketId: string): void {
  const room = rooms.get(code);
  if (!room) return;

  if (room.a?.socketId === socketId) room.a = null;
  if (room.b?.socketId === socketId) room.b = null;

  if (!room.a && !room.b) {
    rooms.delete(code); // room destroyed — nothing left to recover, ever
  }
}

function setText(code: string, slot: PeerSlot, text: string): void {
  const room = rooms.get(code);
  if (!room) return;
  const peer = room[slot];
  if (peer) peer.text = text;
}

function setTyping(code: string, slot: PeerSlot, typing: boolean): void {
  const room = rooms.get(code);
  if (!room) return;
  const peer = room[slot];
  if (peer) peer.typing = typing;
}

function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

function getPeerOf(code: string, slot: PeerSlot): Peer | null {
  const room = rooms.get(code);
  if (!room) return null;
  return room[otherSlot(slot)];
}

function roomIsFull(code: string): boolean {
  const room = rooms.get(code);
  if (!room) return false;
  return Boolean(room.a && room.b);
}

export const RoomStore = {
  joinRoom,
  leaveRoom,
  setText,
  setTyping,
  getRoom,
  getPeerOf,
  roomIsFull,
  otherSlot,
};
