# HomeRent — Deployment Guide

This guide explains how to deploy HomeRent:
- **Database** → MongoDB Atlas
- **Backend** → Render
- **Frontend** → Vercel

---

## Step 1 — MongoDB Atlas (Database)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign in.
2. Create a **free M0 cluster** (any region close to you).
3. Under **Database Access** → Add a database user.
   - Username: `homerent_prod`
   - Password: **use a NEW, strong password** (not the same as your local one).
   - Role: `readWriteAnyDatabase`
4. Under **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`) during setup. You can restrict this later to only Render's IP.
5. Click **Connect** → **Drivers** → copy the full connection string. It looks like:
   ```
   mongodb+srv://homerent_prod:<password>@cluster0.xxxxx.mongodb.net/homerent?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password.

> ⚠️ **Never commit this connection string to GitHub.**

---

## Step 2 — Render (Backend)

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New** → **Web Service**.
3. Connect your `HomeRent` GitHub repository.
4. Use these settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |
| **Plan** | Free |

5. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `MONGO_URI` | *(paste your Atlas connection string)* |
| `JWT_SECRET` | *(generate a NEW long random string — e.g. 64 random characters)* |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | *(your Vercel URL, e.g. `https://homerent.vercel.app`)* — add this after Step 3 |

6. Click **Create Web Service**. Render will build and deploy.
7. Copy the Render URL (e.g. `https://homerent-api.onrender.com`).

> 💡 **Tip for JWT_SECRET:** Run this in any terminal to generate one:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Step 3 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project** → import `HomeRent`.
3. Use these settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Framework Preset** | `Vite` |

4. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://homerent-api.onrender.com/api` *(your Render URL + /api)* |

5. Click **Deploy**.
6. Copy the Vercel URL (e.g. `https://homerent.vercel.app`).

---

## Step 4 — Link Backend to Frontend

1. Go back to Render → your web service → **Environment**.
2. Update `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL=https://homerent.vercel.app
   ```
3. Click **Save Changes** — Render will redeploy automatically.

---

## Final Checklist

- [ ] Atlas cluster is running, network access allows `0.0.0.0/0`
- [ ] Atlas password is NEW (not used anywhere else)
- [ ] Render `JWT_SECRET` is a NEW long random string (64+ characters)
- [ ] `CLIENT_URL` on Render matches the Vercel URL exactly
- [ ] `VITE_API_URL` on Vercel matches the Render URL + `/api`
- [ ] Test: open Vercel URL, browse properties, login, save a property
- [ ] Optional: run the seed script once against Atlas to create test data

---

## Environment Variable Reference

### Render (server)

| Variable | What it is | Example value |
|----------|-----------|---------------|
| `PORT` | Port Express listens on (Render injects this automatically) | `5000` |
| `MONGO_URI` | Atlas full connection string | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/homerent` |
| `JWT_SECRET` | Secret for signing JWT tokens | `a_very_long_random_string_here` |
| `JWT_EXPIRES_IN` | How long tokens stay valid | `7d` |
| `CLIENT_URL` | Your Vercel frontend URL | `https://homerent.vercel.app` |

### Vercel (client)

| Variable | What it is | Example value |
|----------|-----------|---------------|
| `VITE_API_URL` | Backend API URL | `https://homerent-api.onrender.com/api` |
