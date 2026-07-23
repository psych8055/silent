"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode, normalizeRoomCode } from "@/lib/roomCode";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  function handleBegin() {
    const code = generateRoomCode();
    router.push(`/room/${code}`);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = normalizeRoomCode(joinCode);
    if (!code) return;
    router.push(`/room/${code}`);
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[28rem] w-[28rem] rounded-full bg-mind-self/[0.04] blur-3xl animate-breathe" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-driftIn">
        <div className="glass-panel rounded-[2rem] px-8 py-10 sm:px-10 sm:py-12">
          <p className="font-ui text-[0.7rem] uppercase tracking-[0.3em] text-mist">
            no messages · no history
          </p>

          <h1 className="mt-4 font-display text-5xl italic font-light tracking-tight text-white sm:text-6xl">
            Silent
          </h1>

          <p className="mt-5 font-thought text-lg leading-relaxed text-white/60">
            Two people, one room, watching each other think — one keystroke
            at a time. Nothing is saved. When you leave, it&apos;s gone.
          </p>

          <button
            onClick={handleBegin}
            className="mt-9 w-full rounded-2xl bg-white/95 py-4 font-ui text-sm font-medium tracking-wide text-void transition hover:bg-white active:scale-[0.99]"
          >
            Begin a conversation
          </button>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-ui text-xs uppercase tracking-widest text-mist">
              or join one
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ROOM CODE"
              maxLength={12}
              className="thought-area flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center font-ui text-sm tracking-[0.25em] text-white placeholder:tracking-widest placeholder:text-white/25 focus:border-white/25"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-ui text-sm text-white/80 transition hover:bg-white/[0.08] disabled:opacity-30"
            >
              Join
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-ui text-xs text-mist/70">
          Sharing a link takes them straight into the room.
        </p>
      </div>
    </main>
  );
}
