# Mosaic Talent — Railway Deployment Guide

## What's in this folder
Full-stack AI recruitment platform: React + Express + SQLite + Gemini AI.

---

## Deploy to Railway (Step by Step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
```
Create a new repo on github.com, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/mosaic-talent.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Railway
1. Go to https://railway.app → sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `mosaic-talent` repo
4. Railway will auto-detect it and start building

### 3. Set Environment Variables
In Railway → your service → **"Variables"** tab, add:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | your Gemini API key |
| `NODE_ENV` | `production` |

### 4. (Optional) Persist the database
By default SQLite resets on redeploy. To persist data:
1. Railway → **"New"** → **"Volume"** → attach to service → mount path `/data`
2. Add variable: `DB_PATH` = `/data/mosaic_talent.db`

### 5. Get your URL
Railway → Settings → Networking → **"Generate Domain"**

Your candidate link format: `https://your-app.up.railway.app?assess=<id>`

---

## Run Locally
```bash
npm install
```
Create `.env.local`:
```
GEMINI_API_KEY=your_key_here
```
Then:
```bash
npm run dev
# Opens at http://localhost:3000
```
