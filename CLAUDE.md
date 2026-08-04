# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Minecraft Cell Manager — tracks Minecraft "cell" accounts (rank, block, days remaining) with a live-updating React dashboard and a Discord bot, backed by a shared Express/MongoDB API. There are no automated tests in this repo.

## Commands

This is an npm workspaces monorepo (`backend`, `dashboard`, `bot`). Run commands from the repo root unless noted.

```bash
npm run install:all   # install root + all three workspaces
npm run dev            # run backend + dashboard + bot concurrently (root)
```

Per-workspace (run from within `backend/`, `dashboard/`, or `bot/`, or via `--workspace=`):

```bash
npm run dev --workspace=backend    # nodemon src/index.js (port 4000)
npm run dev --workspace=dashboard  # vite dev server (port 3000)
npm run dev --workspace=bot        # nodemon src/index.js
npm run build --workspace=dashboard  # vite build

# Discord bot slash commands must be re-registered after adding/editing a command file:
cd bot && npm run register
```

There is no lint or test script configured in any workspace.

## Architecture

Three independent Node processes communicate only through the backend's REST API and a Socket.IO channel — there is no shared code between workspaces.

```
Discord Bot ──/ce_add etc.──► Backend API ──► MongoDB
                                   │
                            Socket.IO emit "cells:updated"
                                   │
                         ┌─────────┴─────────┐
                     Dashboard              Bot (notification check)
```

- **backend/** (`src/index.js`): Express API + Socket.IO server + Mongoose/MongoDB. Every mutating route (`routes/cells.js`, `routes/config.js`) re-fetches the full cell/config list after writing and emits it via `req.io.emit("cells:updated" | "config:updated", ...)` — the socket payload is always the full, current list, not a diff. `req.io` is attached to every request in middleware. A `setTimeout`/`setInterval` loop in `index.js` decrements every cell's `daysLeft` by 1 at local midnight and re-emits `cells:updated`. `routes/discord.js` proxies Discord's guild-member search API (needs `DISCORD_TOKEN`/`DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID`) so the dashboard/bot can resolve Discord users without exposing the bot token client-side.
- **dashboard/** (React + Vite, no router): `App.jsx` owns all cell state; `hooks/useSocket.js` subscribes to `cells:updated` and replaces state wholesale on every event; `lib/api.js` is the only place that talks to the REST API (`VITE_API_URL`, default `/api`, proxied to `localhost:4000` in dev via `vite.config.js`). Styling is inline `style={}` objects using CSS custom properties (`--accent-green`, `--bg-dark`, `--pixel-font`, etc.) defined in `index.css` — there is no CSS-in-JS library or component styling framework.
- **bot/** (discord.js v14): `src/index.js` loads every file in `commands/` that exports `{ data, execute }` and wires it to `InteractionCreate`; adding a command = adding a file there + running `npm run register`. The bot also opens its own Socket.IO client connection to the backend and runs `checkNotifications()` on every `cells:updated` event — this is the only place Discord DM/channel notifications are sent (guarded by a re-entrancy lock and a 12-hour per-cell cooldown via `lastNotified`; a cell re-notifies every 12 hours as long as it stays at/below the threshold, and the cooldown/`notified` flag are reset — restarting the cycle — whenever a cell's real days/data change via the backend PUT/PATCH `days` routes). `lib/backend.js` resolves the backend URL from `BACKEND_URL`, falling back to a hardcoded Railway production URL when `NODE_ENV=production`/`RAILWAY_ENVIRONMENT` is set, else `localhost:4000`.
- **Cell model** (`backend/src/models/Cell.js`): `daysLeft` is clamped 0–9; `cellName` is globally unique (used as the lookup key in almost every route/command instead of `_id`); `notified`/`lastNotified` track notification state server-side, not client-side.

## Deployment

- Backend → Railway. Dashboard → Vercel (`VITE_API_URL`, `VITE_SOCKET_URL` point at the Railway backend). Bot → Railway/VPS (`BACKEND_URL` must point at the deployed backend; `localhost` only works when everything runs on one machine).
- After changing bot slash command definitions, `npm run register` must be run once against Discord before the change is live (registration is global, not per-guild).
