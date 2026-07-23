# Silent

A conversation that exists only in the present. Two people share a room and watch
each other's words appear as they're typed — no send button, no message
history, nothing saved. Refresh the page and your side is gone; when both
people leave, the room is destroyed.

## How it works

- **Next.js (App Router) + TypeScript** for the UI.
- **A custom Node server** (`server/index.ts`) that wraps the Next.js request
  handler and attaches a **Socket.IO** server to the same HTTP server. This is
  required because real-time, bidirectional WebSocket sync isn't something
  Next.js's own serverless route handlers do — they're request/response, not
  a persistent socket.
- **Everything server-side lives in memory** (`server/rooms.ts`): a plain
  `Map`, no database, no disk writes, no cache layer. When a room's last
  occupant disconnects, its entry is deleted from the map — the text is gone,
  permanently, with nothing to recover.
- Every keystroke calls `text:update`, which the server relays verbatim to
  the other participant in the room (a thin pass-through, not a diff/patch
  engine — simplicity keeps latency low for this scale).

## Do you need "high-end tech" for this?

No. This runs comfortably on the cheapest tier of any Node host. The entire
load per room is two small strings and a handful of tiny socket events —
there's no database to provision, no queue, no heavy compute. The only real
requirement is a host that keeps a **persistent Node process** alive (so the
WebSocket connection doesn't get dropped), which rules out pure
serverless/edge functions but nothing fancier than that.

## Project structure

```
silent/
├── server/
│   ├── index.ts        # custom HTTP server: Next.js + Socket.IO on one port
│   ├── socket.ts        # all socket event handlers
│   └── rooms.ts         # in-memory room state (the only "storage" in the app)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # fonts + global shell
│   │   ├── globals.css          # glass/aesthetic tokens
│   │   ├── page.tsx              # home: create or join a room
│   │   └── room/[code]/page.tsx  # room route
│   ├── components/
│   │   └── RoomClient.tsx        # the live two-panel UI + socket wiring
│   └── lib/
│       ├── types.ts        # shared client/server event & payload types
│       ├── socketClient.ts # client-side socket singleton
│       └── roomCode.ts     # room code generation/normalization
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## Setup

Requires Node.js 18.18+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Click **Begin a conversation** to get a room
code and URL, then open that URL in a second browser tab (or send it to
someone else) to join as the second participant. A third visitor to the same
room code sees a "this room is taken" screen — each room holds exactly two
people.

## Production build

```bash
npm run build
npm start
```

`npm start` runs the same custom server (`server/index.ts`) via `tsx`,
which is what makes the Socket.IO + Next.js combo work identically in dev
and prod. `PORT` and `HOST` env vars are respected if you need to bind
elsewhere.

## Deployment

This needs a host that runs a **long-lived Node process**, not a pure
serverless/edge platform (Vercel's standard serverless functions don't hold
a persistent WebSocket connection open). Good fits:

- **Render / Railway / Fly.io** — point the build command at `npm run build`
  and the start command at `npm start`. All three support a standard
  long-running Node service out of the box.
- **A plain VPS** (DigitalOcean, Hetzner, EC2, etc.) — clone the repo,
  `npm install && npm run build`, then run `npm start` behind a process
  manager like `pm2` and a reverse proxy (nginx/Caddy) that forwards both
  HTTP and WebSocket upgrade requests to port 3000.
- **Docker** — a minimal `Dockerfile` would `COPY` the project, run
  `npm ci && npm run build`, and `CMD ["npm", "start"]`; deploy the image
  anywhere that runs containers with a persistent process.

If you specifically want to stay on Vercel, you'd need Vercel's WebSocket
support in a **Fluid Compute / long-running function** configuration, or run
the Socket.IO server on a separate small host and point the client at it —
the plain Node-process hosts above are simpler for this app's needs.

## Notes on the "no persistence" guarantee

- No database, cache, or file is ever written by this app.
- `RoomStore` (`server/rooms.ts`) is a single in-memory `Map` scoped to the
  running process — restart the server and every room is gone.
- The client never touches `localStorage`/`sessionStorage`/cookies for
  conversation content — component state only, which React discards on
  unmount/refresh.
- A room is deleted from memory the instant both slots are empty, whether
  that's from an explicit leave or a dropped connection.
