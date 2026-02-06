# Deploy with Railway + Vercel

- **Backend** (Express + Prisma + PostgreSQL) → Railway  
- **Frontend** (Next.js) → Vercel  

Do **Part 1** first, then **Part 2**. You need the backend URL before deploying the frontend.

---

## Part 1: Backend on Railway

### 1.1 Push code to GitHub

Make sure your project is in a GitHub repo and the latest code is pushed.

### 1.2 Create a Railway project

1. Go to **[railway.app](https://railway.app)** and sign in with **GitHub**.
2. Click **New Project**.
3. Choose **Deploy from GitHub repo** and select your **stock portfolio** repo.
4. Railway creates a service from the repo. You’ll configure it next.

### 1.3 Set root directory and add PostgreSQL

1. Click the new **service** (your repo name).
2. Open **Settings** (or the service’s **⚙️**).
3. Under **Source**, set **Root Directory** to: **`backend`**.
4. Go back to the **Project** view (your project name at the top).
5. Click **+ New** → **Database** → **PostgreSQL**.
6. When PostgreSQL is created, click your **backend service** again → **Variables**.
7. Set **`DATABASE_URL`** using the **public** URL (see **Troubleshooting: Can't reach database** below if you get a connection error).

### 1.4 Add env variables for the backend

In the backend service → **Variables**, add:

| Name         | Value |
|-------------|--------|
| `JWT_SECRET` | A long random string (e.g. run `openssl rand -base64 32` in a terminal and paste the result). |
| `NODE_ENV`   | `production` |

Save.

### 1.5 Set build and start commands

Still in the backend service:

1. **Settings** → **Build** (or **Deploy**):
   - **Build Command:** `npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
2. **Settings** → **Networking** (or **Deploy**):
   - Enable **Generate domain** / **Public networking** so the service gets a public URL (e.g. `https://xxx.up.railway.app`).

### 1.6 Deploy and copy the API URL

1. Trigger a deploy (e.g. **Deploy** or push a commit; Railway may auto-deploy).
2. When the deploy is done, open **Settings** → **Networking** (or the **Deploy** tab) and copy the **public URL** (e.g. `https://stock-portfolio-backend.up.railway.app`).
3. Test it: open **`<your-url>/health`** in the browser. You should see **API running**.
4. Save this URL — this is your **API URL** for the frontend. **No trailing slash.**

---

## Part 2: Frontend on Vercel

### 2.1 Import the repo on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in with **GitHub**.
2. Click **Add New** → **Project**.
3. **Import** your **stock portfolio** GitHub repo.
4. Click **Import** (don’t deploy yet).

### 2.2 Configure the project

1. **Root Directory:** click **Edit** and set it to **`frontend`**. Confirm.
2. **Framework Preset:** leave as **Next.js**.
3. **Build Command:** leave as **`npm run build`** (default).
4. **Output Directory:** leave default.

### 2.3 Add environment variable

1. Under **Environment Variables**, add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** the Railway API URL from Part 1 (e.g. `https://stock-portfolio-backend.up.railway.app`) — **no trailing slash**.
2. Select **Production** (and **Preview** if you want preview deployments to use the same API).
3. Click **Deploy**.

### 2.4 Get your app URL

When the build finishes, Vercel shows the live URL (e.g. `https://stock-portfolio.vercel.app`). Open it and use the app.

---

## Part 3: CORS (if the app can’t reach the API)

If the browser blocks requests (e.g. CORS error in the console):

1. In your repo, open **`backend/src/app.ts`**.
2. Replace the line  
   `app.use(cors());`  
   with:
   ```ts
   app.use(cors({ origin: ["https://your-app.vercel.app", "http://localhost:3000"] }));
   ```
   Use your **real Vercel URL** (and keep `http://localhost:3000` for local dev).
3. Commit, push. Railway will redeploy. Reload the Vercel app and try again.

---

## Checklist

- [ ] Repo pushed to GitHub.
- [ ] Railway: new project, deploy from GitHub, **Root Directory** = `backend`.
- [ ] Railway: PostgreSQL added, **`DATABASE_URL`** in backend variables.
- [ ] Railway: **`JWT_SECRET`** and **`NODE_ENV=production`** set.
- [ ] Railway: **Build** = `npm run build`, **Start** = `npx prisma migrate deploy && npm start`, public URL enabled.
- [ ] Railway: **`/health`** returns “API running”, API URL copied (no trailing slash).
- [ ] Vercel: project imported, **Root Directory** = `frontend`.
- [ ] Vercel: **`NEXT_PUBLIC_API_URL`** = Railway API URL.
- [ ] If needed, CORS in **`backend/src/app.ts`** updated with the Vercel URL.

Done. Frontend on Vercel, backend on Railway.

---

## Troubleshooting: "Can't reach database server at Postgres.railway.internal"

If deploy fails with:
```text
Error: P1001: Can't reach database server at `Postgres.railway.internal:5432`
```
Railway is using the **private** DB URL; your service can’t reach it. Use the **public** URL instead.

1. In Railway, click your **PostgreSQL** service (the database).
2. Open the **Variables** or **Connect** tab.
3. Find **`DATABASE_PUBLIC_URL`** or the **Public** connection string (host is usually `xxx.railway.app` or a long hostname, **not** `Postgres.railway.internal`).
4. Copy that full URL (starts with `postgresql://`).
5. Go to your **backend service** → **Variables**.
6. Add or edit **`DATABASE_URL`**:
   - **Name:** `DATABASE_URL`
   - **Value:** paste the **public** URL you copied (the whole string, no quotes).
7. Remove any **reference** to the database that was injecting the private URL (so only your manual `DATABASE_URL` remains).
8. Redeploy the backend.

The public URL looks like:
```text
postgresql://postgres:PASSWORD@containers-us-west-xxx.railway.app:PORT/railway
```
Use that as `DATABASE_URL`. No trailing slash.
