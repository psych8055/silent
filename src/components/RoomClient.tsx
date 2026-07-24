"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socketClient";
import { normalizeRoomCode } from "@/lib/roomCode";
import type { PeerSlot, PresenceState } from "@/lib/types";

const TYPING_IDLE_MS = 900;
const THEMES = [
  { name: "blue rust", from: "#90d2d0", to: "#c95d37" },
  { name: "clay blush", from: "#c95d37", to: "#ecc8ba" },
  { name: "leaf green", from: "#cbde8f", to: "#5aaf47" },
] as const;

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
  const [themeIndex, setThemeIndex] = useState(1);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const activeTheme = THEMES[themeIndex];

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
    (value: string) => {
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
    <main
      className="silent-room-shell flex h-dvh max-h-dvh flex-col overflow-hidden text-stone-500"
      style={
        {
          "--theme-from": activeTheme.from,
          "--theme-to": activeTheme.to,
        } as React.CSSProperties
      }
    >
      <div className="room-background-halves" aria-hidden="true">
        <div className="room-background-half room-background-half--left" />
        <div className="room-background-half room-background-half--right" />
      </div>

      <header className="grid h-[7.5rem] shrink-0 grid-cols-[1fr_auto_1fr] items-start px-7 pt-6 sm:px-10">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-5">
            {THEMES.map((theme, index) => (
              <button
                key={theme.name}
                type="button"
                aria-label={`Use ${theme.name} theme`}
                aria-pressed={themeIndex === index}
                onClick={() => setThemeIndex(index)}
                className="h-6 w-6 rounded-full opacity-85 blur-[0.2px] transition duration-200 hover:scale-105 focus:outline-none focus-visible:outline-none"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${theme.from}, ${theme.to} 78%)`,
                }}
              />
            ))}
          </div>
        </div>

        <img
          src="/kwite-logo.svg"
          alt="Kwite"
          className="pointer-events-none h-8 w-auto"
        />

        <div className="flex items-center justify-end gap-7">
          <PresenceBadge presence="online" typing={false} tone="green" label="Live" />
          <PresenceBadge
            presence={peerPresence}
            typing={peerTyping}
            tone="blue"
          />
          <button
            onClick={handleShare}
            className="sr-only"
          >
            {copied ? "Copied" : "Share link"}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 gap-5 px-5 pb-4 sm:px-8 md:grid-cols-2 md:grid-rows-1 md:gap-8 md:px-10 md:pb-6">
        <Panel
          value={selfText}
          onChange={handleChange}
          editable
          placeholder="You are live now."
          side="left"
        />
        <Panel
          value={peerText}
          editable={false}
          presence={peerPresence}
          typing={peerTyping}
          placeholder={
            status === "connecting"
              ? "Connecting..."
              : peerPresence === "online"
              ? peerTyping
                ? "They are typing..."
                : "They are live now."
              : "Waiting for them to join."
          }
          side="right"
        />
      </div>

      <footer className="grid h-[3.25rem] shrink-0 grid-cols-1 gap-2 px-8 pb-4 text-center font-ui text-sm text-stone-500/75 sm:px-10 md:grid-cols-2">
        <p>Opensource platform</p>
        <p>No chats archived.</p>
      </footer>
    </main>
  );
}

function PresenceBadge({
  presence,
  typing,
  tone,
  label,
}: {
  presence: PresenceState;
  typing: boolean;
  tone: "green" | "blue";
  label?: string;
}) {
  const statusLabel =
    label ?? (typing ? "Thinking" : presence === "online" ? "Live" : "Gone quiet");
  const dotColor =
    tone === "green"
      ? "bg-lime-500"
      : presence === "online"
      ? "bg-sky-400"
      : "bg-sky-400";

  return (
    <div className="flex items-center gap-2 font-ui text-sm text-stone-500/80">
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotColor} ${
          presence === "online" ? "animate-pulseDot" : ""
        }`}
      />
      {statusLabel}
    </div>
  );
}

function Panel({
  value,
  onChange,
  editable,
  placeholder,
  presence = "online",
  typing = false,
  side,
}: {
  value: string;
  onChange?: (value: string) => void;
  editable: boolean;
  placeholder: string;
  presence?: PresenceState;
  typing?: boolean;
  side: "left" | "right";
}) {
  const isDisconnectedPeer = !editable && presence === "disconnected";
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!editable && editor.textContent !== value) {
      editor.textContent = value;
    }

    function updateOverflowState() {
      if (!editor) return;
      editor.dataset.overflowing = String(editor.scrollHeight > editor.clientHeight + 1);
    }

    updateOverflowState();
    window.addEventListener("resize", updateOverflowState);
    return () => window.removeEventListener("resize", updateOverflowState);
  }, [editable, value]);

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    onChange?.(e.currentTarget.innerText);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  return (
    <section
      className={`silent-room-panel silent-room-panel--${side} relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2.4rem] border border-white/65 px-7 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_20px_80px_rgba(84,64,30,0.08)] transition-all duration-500 sm:px-11 sm:py-10 md:rounded-[3.2rem] ${
        isDisconnectedPeer ? "opacity-85" : ""
      }`}
    >
      {typing && (
        <span className="absolute right-10 top-10 flex gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      )}

      {!value && (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute left-7 right-7 top-1/2 -translate-y-1/2 font-ui text-[clamp(2rem,3.65vw,4.05rem)] font-light leading-[1.08] text-white/70 sm:left-11 sm:right-11"
        >
          {placeholder}
        </p>
      )}

      <div
        ref={editorRef}
        contentEditable={editable}
        suppressContentEditableWarning
        role={editable ? "textbox" : "status"}
        aria-label={editable ? "Your live text" : "Their live text"}
        aria-multiline="true"
        spellCheck={false}
        onInput={editable ? handleInput : undefined}
        onPaste={editable ? handlePaste : undefined}
        className="room-editor no-scrollbar font-ui text-[clamp(2rem,3.65vw,4.05rem)] font-light leading-[1.08] text-white"
      >
        {editable ? undefined : value}
      </div>
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
    <main className="silent-room-shell flex min-h-dvh max-h-[100dvh] items-center justify-center px-6">
      <div className="max-w-sm rounded-[2rem] border border-white/70 bg-white/[0.08] px-8 py-10 text-center animate-driftIn">
        <h1 className="font-ui text-3xl font-light text-white">{title}</h1>
        <p className="mt-3 font-ui text-lg text-stone-500">{subtitle}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-8 w-full rounded-2xl bg-white/80 py-3 font-ui text-sm font-medium text-stone-700 hover:bg-white"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </main>
  );
}
