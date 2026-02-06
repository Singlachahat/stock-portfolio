# Stock Portfolio Dashboard

A full-stack portfolio tracker: sign up, add holdings, and view portfolio summary with market data and charts.

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, Recharts, Axios
- **Backend:** Express, TypeScript, Prisma, PostgreSQL
- **Auth:** JWT (signup/login)
- **Market data:** Yahoo Finance (yahoo-finance2), Google Finance scrape, RapidAPI Yahoo fallback

---

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** (local or hosted, e.g. Railway, Neon)
- (Optional) **RapidAPI** key for Yahoo Finance fallback if primary sources fail

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd "stock portfolio"
```

Install root (optional, for Prisma client at root if needed):

```bash
npm install
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="your-secret-min-32-chars"
PORT=5000
```

Optional (for price fallback when Yahoo/Google fail):

```env
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=yahoo-finance-real-time1.p.rapidapi.com
```

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start backend:

```bash
npm run dev
```

API runs at **http://localhost:5000**.  
Endpoints: `/`, `/health`, `/api/users`, `/api/portfolios`, `/api/stocks`, `/api/market`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` (or copy from `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Do **not** add a trailing slash to `NEXT_PUBLIC_API_URL` (e.g. use `http://localhost:5000`, not `http://localhost:5000/`).

Start frontend:

```bash
npm run dev
```

App runs at **http://localhost:3000**.

---

## Usage

1. **Sign up** – Open http://localhost:3000/signup, create an account (name, email, password).
2. **Log in** – Use http://localhost:3000/login with the same credentials.
3. **Dashboard** – After login you’re redirected to the dashboard.
4. **Portfolio** – A portfolio is created for your user. You can rename it from the dashboard.
5. **Add holdings** – Search for a stock by symbol/name, choose quantity and purchase price, then add. Holdings are shown in a table with current price and P&amp;L.
6. **Charts** – View sector allocation and top holdings (by value).
7. **Refresh prices** – Use the refresh control to update market data (uses Yahoo → Google → RapidAPI fallback).
8. **Edit/remove** – Update quantity or price, or remove a holding from the table/modal.

---

## Deployment

- **Frontend (Vercel):** Set root to `frontend`, set `NEXT_PUBLIC_API_URL` to your backend URL (no trailing slash).
- **Backend (e.g. Railway):** Set root to `backend`, set `DATABASE_URL`, `JWT_SECRET`, and `PORT`. Use `npm run build` then `npm start`. Optional: set `RAPIDAPI_KEY` and `RAPIDAPI_HOST` for fallback market data.

---

## Scripts

| Location   | Command           | Description                |
|-----------|-------------------|----------------------------|
| Backend   | `npm run dev`     | Run API with ts-node-dev   |
| Backend   | `npm run build`   | Prisma generate + tsc      |
| Backend   | `npm start`       | Run compiled server        |
| Frontend  | `npm run dev`     | Next.js dev (port 3000)    |
| Frontend  | `npm run build`   | Next.js production build   |
| Frontend  | `npm start`       | Run production frontend    |
