# ⛏️ Minecraft Cell Manager

A full-stack system to manage Minecraft accounts and their cells — with a live React dashboard and a Discord bot.

---

## 📁 Project Structure

```
minecraft-cell-manager/
├── backend/          # Node.js + Express + MongoDB API + Socket.IO
├── dashboard/        # React (Vite) live dashboard
└── bot/              # discord.js slash-command bot
```

---

## 🚀 Setup Guide

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A Discord Bot (from [Discord Developer Portal](https://discord.com/developers/applications))

---

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and dashboard URL
npm install
npm run dev
```

**`.env`:**
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/minecraft-cells
DASHBOARD_URL=http://localhost:3000
```

---

### 3. Dashboard

```bash
cd dashboard
npm install
npm run dev
# Opens at http://localhost:3000
```

Optionally create `dashboard/.env`:
```env
VITE_API_URL=/api
VITE_SOCKET_URL=
```

---

### 4. Discord Bot

```bash
cd bot
cp .env.example .env
# Fill in your Discord token and client ID
npm install

# Register slash commands globally (run once)
npm run register

# Start the bot
npm run dev
```

**`.env`:**
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
BACKEND_URL=http://localhost:4000
```

#### Discord Bot Permissions needed:
- `Send Messages`
- `Send Messages in Threads`
- `Embed Links`
- `Use Slash Commands`
- `Direct Messages` (for DM notifications)

---

## 🤖 Bot Slash Commands

| Command | Description |
|---|---|
| `/add_cell` | Add a new cell with all details |
| `/update_days` | Update days remaining for a cell |
| `/remove_cell` | Delete a cell by name |
| `/list_cells` | Show all cells as embeds in the channel |

---

## 🌐 Dashboard Features

- **Live updates** via Socket.IO — no refresh needed
- **Sort** by days (urgent first), days (most first), account name, or Discord user
- **Filter** to show only expiring cells (≤2 days)
- **Search** by account, cell name, or Discord user
- **Pixel progress bar** showing days remaining (9 blocks)
- **Add / edit / delete** cells directly from the UI
- **Bot config panel** — set notification threshold, DM vs channel mode, channel ID

---

## ⚙️ Bot Config (via Dashboard)

Open the dashboard → click **⚙️ Config**:

| Setting | Description |
|---|---|
| Notification Threshold | Notify when daysLeft ≤ this value (default: 2) |
| Notification Mode | `DM` — send DM to user, `Channel` — ping user in a channel |
| Channel ID | Discord channel ID (only for Channel mode) |

---

## 🔁 How It Works

```
Discord Bot ──/add_cell──► Backend API ──► MongoDB
                                │
                         Socket.IO emit
                                │
                          Dashboard (live)
                                │
                    Cell updated → notification check
                                │
                        Bot sends DM/ping
```

1. Bot or dashboard creates/updates a cell → stored in MongoDB
2. Backend emits `cells:updated` via Socket.IO to all clients
3. Dashboard re-renders live without refresh
4. Bot listens to `cells:updated` and sends Discord notifications when `daysLeft ≤ threshold`

---

## ☁️ Deployment

### Backend → [Railway](https://railway.app)
- Set env vars in Railway dashboard
- Provision a MongoDB plugin or use MongoDB Atlas

### Dashboard → [Vercel](https://vercel.com)
- Set `VITE_API_URL=https://your-backend.railway.app/api`
- Set `VITE_SOCKET_URL=https://your-backend.railway.app`

### Bot → Railway / VPS
- Set env vars
- Run `npm run register` once to register commands
- Then `npm start`

---

## 🎯 Features Summary

- ✅ Full CRUD for cells (backend + dashboard + bot)
- ✅ Live sync between dashboard and bot via Socket.IO
- ✅ Automatic daily countdown at midnight
- ✅ Configurable notification threshold
- ✅ DM or channel notification modes
- ✅ Discord embeds with Minecraft avatars
- ✅ Pixel-art styled dark dashboard
- ✅ Search, sort, filter on dashboard
- ✅ Urgent cell visual indicators (red glow, pulse)
