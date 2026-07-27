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
    <main className="kwite-home-shell relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-8 text-white sm:px-6">
      <div className="relative z-10 w-full max-w-md animate-driftIn">
        <div className="kwite-home-card px-7 py-9 sm:px-10 sm:py-12">
          <p className="font-ui text-[0.7rem] uppercase tracking-[0.3em] text-white/90">
            no messages · no history
          </p>

          <h1 className="mt-4 font-ui text-5xl font-light text-white sm:text-6xl">
            shhh...
          </h1>

          <p className="mt-5 font-ui text-lg font-light leading-relaxed text-white/80">
            Two people, one room, watching each other think — one keystroke
            at a time. Nothing is saved. When you leave, it&apos;s gone.
          </p>

          <button
            onClick={handleBegin}
            className="mt-9 w-full rounded-2xl border-white/65 bg-[linear-gradient(90deg,#d5d2cd_0%,#edb753_100%)] py-4 font-ui text-sm font-medium tracking-wide text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_36px_rgba(84,64,30,0.12)] transition hover:brightness-105 active:scale-[0.99]"
          >
            Begin a conversation
          </button>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/60" />
            {/* <span className="font-ui text-xs uppercase tracking-widest text-white/90 opacity-0">
              -
            </span> */}
            <div className="h-px flex-1 bg-white/60" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Room Code - (Coming Soon)"
              maxLength={12}
              disabled
              className="thought-area min-w-0 flex-1 rounded-xl border border-white/65 bg-white/22 px-4 py-3 text-center font-ui text-sm tracking-[0.25em] text-white placeholder:tracking-widest placeholder:text-white/80 focus:border-white/90"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="rounded-xl border border-white/65 bg-white/22 px-5 py-3 font-ui text-sm text-white transition hover:bg-white/32 disabled:opacity-45"
            >
              Join
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-ui text-xs text-white/90">
          Sharing a link takes them straight into the room.
        </p>
      </div>
    </main>
  );
}
