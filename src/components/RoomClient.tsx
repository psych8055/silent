"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socketClient";
import { normalizeRoomCode } from "@/lib/roomCode";
import type { PeerSlot, PresenceState } from "@/lib/types";

const TYPING_IDLE_MS = 900;

export function RoomClient({ rawCode }: { rawCode: string }) {
  const router = useRouter();
  const code = normalizeRoomCode(decodeURIComponent(rawCode));

  const [slot, setSlot] = useState<PeerSlot | null>(null);
  const [status, setStatus] = useState<
    "connecting" | "joined" | "full" | "closed"
  >("connecting");

  const [selfText, setSelfText] = useState("");
  const [peerText, setPeerText] = useState("");
  const [peerPresence, setPeerPresence] = useState<PresenceState>(
    "disconnected"
  );
  const [peerTyping, setPeerTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!code) {
      setStatus("closed");
      return;
    }

    const socket = getSocket();

    function onJoined(snapshot: {
      code: string;
      slot: PeerSlot;
      selfText: string;
      peerText: string;
      peerPresence: PresenceState;
      peerTyping: boolean;
      roomFull: boolean;
    }) {
      setSlot(snapshot.slot);
      setPeerText(snapshot.peerText);
      setPeerPresence(snapshot.peerPresence);
      setPeerTyping(snapshot.peerTyping);
      setStatus("joined");
    }

    function onFull() {
      setStatus("full");
    }

    function onPeerText({ text }: { text: string }) {
      setPeerText(text);
    }

    function onPeerTyping({ typing }: { typing: boolean }) {
      setPeerTyping(typing);
    }

    function onPeerPresence({ presence }: { presence: PresenceState }) {
      setPeerPresence(presence);
      if (presence === "disconnected") setPeerTyping(false);
    }

    socket.on("room:joined", onJoined);
    socket.on("room:full", onFull);
    socket.on("peer:text", onPeerText);
    socket.on("peer:typing", onPeerTyping);
    socket.on("peer:presence", onPeerPresence);

    if (socket.connected) {
      socket.emit("room:join", { code });
    } else {
      socket.once("connect", () => socket.emit("room:join", { code }));
      socket.connect();
    }

    const handleUnload = () => {
      socket.emit("room:leave", { code });
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      socket.emit("room:leave", { code });
      socket.off("room:joined", onJoined);
      socket.off("room:full", onFull);
      socket.off("peer:text", onPeerText);
      socket.off("peer:typing", onPeerTyping);
      socket.off("peer:presence", onPeerPresence);
      window.removeEventListener("beforeunload", handleUnload);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [code]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setSelfText(value);

      const socket = getSocket();
      socket.emit("text:update", { code, text: value });

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit("typing:state", { code, typing: true });
      }
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit("typing:state", { code, typing: false });
      }, TYPING_IDLE_MS);
    },
    [code]
  );

  async function handleShare() {
    const url = `${window.location.origin}/room/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — silently ignore, the code is visible regardless
    }
  }

  if (!code) {
    return <StatusScreen title="No room" subtitle="That link isn't valid." />;
  }

  if (status === "full") {
    return (
      <StatusScreen
        title="This room is taken"
        subtitle="Two people are already here. Begin your own conversation instead."
        actionLabel="Begin a conversation"
        onAction={() => router.push("/")}
      />
    );
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl italic text-white/90">
            Silent
          </span>
          <span className="font-ui text-xs tracking-[0.2em] text-mist">
            {code}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <PresenceBadge presence={peerPresence} typing={peerTyping} />
          <button
            onClick={handleShare}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-ui text-xs text-white/70 transition hover:bg-white/[0.08]"
          >
            {copied ? "Copied" : "Share link"}
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 px-4 pb-4 sm:gap-5 sm:px-5 sm:pb-5 md:grid-cols-2">
        <Panel
          label="Your thoughts"
          accent="self"
          value={selfText}
          onChange={handleChange}
          editable
          placeholder="Start typing…"
        />
        <Panel
          label="Their thoughts"
          accent="them"
          value={peerText}
          editable={false}
          presence={peerPresence}
          typing={peerTyping}
          placeholder={
            status === "connecting"
              ? "Connecting…"
              : peerPresence === "online"
              ? "Waiting for them to begin…"
              : "No one here yet."
          }
        />
      </div>
    </main>
  );
}

function PresenceBadge({
  presence,
  typing,
}: {
  presence: PresenceState;
  typing: boolean;
}) {
  const label = typing ? "Thinking" : presence === "online" ? "Online" : "Gone quiet";
  const dotColor =
    presence === "online" ? "bg-mind-self" : "bg-white/25";

  return (
    <div className="flex items-center gap-2 font-ui text-xs text-white/60">
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotColor} ${
          presence === "online" ? "animate-pulseDot" : ""
        }`}
      />
      {label}
    </div>
  );
}

function Panel({
  label,
  accent,
  value,
  onChange,
  editable,
  placeholder,
  presence = "online",
  typing = false,
}: {
  label: string;
  accent: "self" | "them";
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  editable: boolean;
  placeholder: string;
  presence?: PresenceState;
  typing?: boolean;
}) {
  const isDisconnectedPeer = !editable && presence === "disconnected";
  const accentText = accent === "self" ? "text-mind-self" : "text-other-them";

  return (
    <section
      className={`glass-panel relative flex flex-col overflow-hidden rounded-[1.75rem] p-6 transition-all duration-500 sm:p-8 ${
        isDisconnectedPeer ? "opacity-50 saturate-0" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`font-ui text-[0.7rem] uppercase tracking-[0.25em] ${accentText}`}
        >
          {label}
        </span>
        {typing && (
          <span className="flex gap-1">
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
        )}
      </div>

      <textarea
        value={value}
        onChange={onChange}
        readOnly={!editable}
        placeholder={placeholder}
        spellCheck={false}
        autoFocus={editable}
        className="thought-area no-scrollbar flex-1 font-thought text-2xl italic leading-relaxed text-white/90 sm:text-[1.7rem]"
      />
    </section>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-white/50"
      style={{ animationDelay: delay }}
    />
  );
}

function StatusScreen({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="glass-panel max-w-sm rounded-[2rem] px-8 py-10 text-center animate-driftIn">
        <h1 className="font-display text-3xl italic text-white">{title}</h1>
        <p className="mt-3 font-thought text-lg text-white/60">{subtitle}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-8 w-full rounded-2xl bg-white/95 py-3 font-ui text-sm font-medium text-void hover:bg-white"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </main>
  );
}
