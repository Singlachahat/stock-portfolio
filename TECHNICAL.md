# Technical Document: Challenges and Solutions

Short write-up of main technical challenges and how they were addressed in the Stock Portfolio project.

---

## 1. Market data reliability (Yahoo / Google / RapidAPI)

**Challenge:** A single source (e.g. Yahoo Finance npm or direct APIs) can fail, rate-limit, or return incomplete data, so portfolio prices and P&amp;L would be wrong or missing.

**Solution:** A layered fallback in `market.service.ts`:

- **Primary:** `yahoo-finance2` for quote and price.
- **Secondary:** Google Finance scrape (e.g. for P/E and earnings) and to fill gaps.
- **Tertiary:** RapidAPI Yahoo Finance–style API (`getYahooViaRapid`) when the primary Yahoo path fails or returns no price.

Refresh and single-symbol quote both use this flow: try Yahoo → if no usable price, try RapidAPI → merge P/E and earnings from Google where useful. All external calls are wrapped in try/catch so one failing provider doesn’t crash the server; errors are logged and stored where applicable (e.g. `lastError` on cache).

---

## 2. Stock search and external search API

**Challenge:** Search had to work against the DB (symbol/name) and, for adding new tickers, possibly an external search API that can return malformed or missing data.

**Solution:**

- **Validation:** Query string is validated (e.g. min length, type) before calling the search API or DB.
- **Safe parsing:** Response is checked for the presence of `quotes` (or equivalent) before use; missing or non-array values are treated as “no results.”
- **Stable API contract:** On external API errors or parse failures, the backend returns `200` with `{ stocks: [] }` instead of 500, so the frontend can always render a list (empty or populated) without special error handling for search.

---

## 3. Frontend–backend URL and CORS

**Challenge:** Frontend and backend run on different origins (e.g. localhost:3000 vs localhost:5000, or Vercel vs Railway). A trailing slash in `NEXT_PUBLIC_API_URL` (e.g. `https://api.example.com/`) led to double slashes in paths like `//api/users/login` and 404s.

**Solution:**

- **Normalize base URL:** In `frontend/lib/api.ts`, `NEXT_PUBLIC_API_URL` is stripped of a trailing slash so paths are always built as `baseURL + "/api/..."` with a single slash.
- **CORS:** Backend uses `cors({ origin: "*" })` so the browser allows requests from the frontend origin. For production, you can restrict `origin` to the deployed frontend URL.

---

## 4. Authentication and portfolio scoping

**Challenge:** Users must only see and modify their own portfolio and holdings; unauthenticated or invalid tokens must be rejected cleanly.

**Solution:**

- **JWT middleware:** `auth.middleware.ts` checks `Authorization: Bearer <token>`, verifies JWT with `JWT_SECRET`, and attaches `userId` (and optionally email) to `req`. Invalid or expired tokens return 401 with a clear message.
- **Portfolio routes:** All portfolio and holdings routes use this auth middleware. Controllers resolve the portfolio by `req.userId` (e.g. `portfolios/me` → portfolio where `userId = req.userId`), so there is no way to access or change another user’s data by ID.
- **Frontend:** Token is stored (e.g. in memory or localStorage) and sent on every request via an Axios interceptor; login/signup pages redirect to dashboard on success.

---

## 5. TypeScript and Recharts

**Challenge:** Recharts typings (e.g. optional `percent`, `value` in tooltips, `tickFormatter` signatures) caused TypeScript errors in sector and top-holdings charts.

**Solution:**

- **Optional fields:** Use optional chaining and defaults (e.g. `payload?.percent ?? 0`) so missing data doesn’t break rendering.
- **Tooltip / value type:** Cast or type tooltip `value` as `ValueType` where Recharts expects it.
- **XAxis tickFormatter:** Use the correct signature (value, index) and return a string so TypeScript and Recharts are satisfied.

---

## 6. Deployment (Vercel + Railway)

**Challenge:** Backend and frontend are deployed on different platforms (e.g. Railway for API + Postgres, Vercel for Next.js); each has its own root directory and env handling.

**Solution:**

- **Backend (Railway):** Root set to `backend`; `DATABASE_URL` from Railway Postgres (public URL); `dotenv` in code for local `.env`; listen on `0.0.0.0:PORT` so the server accepts external requests; build = `prisma generate && tsc`, start = `node dist/server.js`.
- **Frontend (Vercel):** Root set to `frontend`; `NEXT_PUBLIC_API_URL` set to the Railway backend URL (no trailing slash) so all API calls target the correct host.

---

## Summary

| Area              | Challenge                          | Approach                                      |
|-------------------|------------------------------------|-----------------------------------------------|
| Market data       | Single source unreliable           | Yahoo → Google → RapidAPI fallback            |
| Stock search      | External API and errors            | Validation, safe parsing, 200 + empty array   |
| API base URL      | Double slash and 404s              | Strip trailing slash in frontend base URL     |
| Auth & security   | Per-user data isolation            | JWT middleware + portfolio by `userId`        |
| Recharts          | TypeScript / typing issues         | Optional fields, ValueType, correct formatters |
| Deployment        | Different roots and envs           | Backend root + 0.0.0.0; frontend env for API  |

These choices keep the app stable with multiple data sources, clear auth boundaries, and predictable behavior in local and deployed environments.
