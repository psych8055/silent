export type PeerSlot = "a" | "b";

export type PresenceState = "online" | "disconnected";

export interface RoomSnapshot {
  code: string;
  slot: PeerSlot;
  selfText: string;
  peerText: string;
  peerPresence: PresenceState;
  peerTyping: boolean;
  roomFull: boolean;
}

/** Client -> Server events */
export interface ClientToServerEvents {
  "room:join": (payload: { code: string }) => void;
  "text:update": (payload: { code: string; text: string }) => void;
  "typing:state": (payload: { code: string; typing: boolean }) => void;
  "room:leave": (payload: { code: string }) => void;
}

/** Server -> Client events */
export interface ServerToClientEvents {
  "room:joined": (snapshot: RoomSnapshot) => void;
  "room:full": () => void;
  "peer:text": (payload: { text: string }) => void;
  "peer:typing": (payload: { typing: boolean }) => void;
  "peer:presence": (payload: { presence: PresenceState }) => void;
}
