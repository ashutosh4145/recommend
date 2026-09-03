# The Catalog — Product Recommendation Site

A small React (Vite) storefront with an AI-powered "Get Recommendations" feature.
The user's request and the product list are sent to a tiny Express backend,
which calls Google's Gemini API. **The Gemini key lives only in the
backend's `.env` file — it is never exposed to the browser.**

```
product-recs/
├── backend/            # Express server, proxies OpenAI, holds the API key
│   ├── server.js
│   ├── package.json
│   ├── .env            # GEMINI_API_KEY goes here (not committed)
│   └── .env.example
└── frontend/           # React + Vite app
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env            # VITE_BACKEND_URL (not committed)
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── products.js       # hardcoded catalog (14 items)
        ├── api.js            # fetch wrapper for the backend
        ├── components.jsx    # ProductCard, ProductList, RecommendationInput, RecommendedSection
        └── index.css
```

## 1. Run it locally

**Backend**
```bash
cd backend
cp .env.example .env      # then paste your real Gemini API key into .env
npm install
npm start                 # runs on http://localhost:8787
```

Get a Gemini API key free at https://aistudio.google.com/apikey

**Frontend** (in a second terminal)
```bash
cd frontend
cp .env.example .env      # default already points at localhost:8787
npm install
npm run dev                # runs on http://localhost:5173
```

Open http://localhost:5173, type something like "I want a phone under $500",
and click **Get Recommendations**.

## 2. How the AI call works

1. The browser sends `{ userInput, products }` to `POST /api/recommend` on the backend.
2. The backend sends a system + user prompt to Gemini (`gemini-1.5-flash` by default,
   configurable via `GEMINI_MODEL`), asking for **only** a JSON array of matching product IDs.
3. The backend parses and validates that response, then returns `{ ids: [...] }`.
4. The frontend filters `products.js` by those IDs and renders them in the
   "Recommended for you" section, with loading and error states handled in `App.jsx`.

## 3. Deploy

### Backend → Render / Railway / Fly.io (any Node host works)
- Push this repo to GitHub.
- Create a new Node web service pointed at the `backend/` folder.
- Start command: `npm start`.
- Add environment variables in the host's dashboard: `GEMINI_API_KEY`, `GEMINI_MODEL` (optional), `PORT` (optional).
- Note the deployed URL, e.g. `https://your-backend.onrender.com`.

### Frontend → Vercel
- Import the same GitHub repo into Vercel.
- Set **Root Directory** to `frontend`.
- Build command: `npm run build`, Output directory: `dist` (Vercel auto-detects Vite).
- In Vercel Project Settings → Environment Variables, add:
  `VITE_BACKEND_URL = https://your-backend.onrender.com`
- Deploy. Vercel gives you a live URL like `https://your-project.vercel.app`.

**Never commit `.env` files.** Both `backend/.gitignore` and `frontend/.gitignore`
already exclude them — only `.env.example` files are committed.

## 4. Push to GitHub (from this folder)

```bash
git init
git add .
git commit -m "Product recommendation site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deliverables checklist
- [ ] GitHub repo link: _add after pushing_
- [ ] Live Vercel deployment link: _add after deploying_
- [ ] Backend host URL set as `VITE_BACKEND_URL` in Vercel
- [ ] `GEMINI_API_KEY` set in the backend host's environment variables
