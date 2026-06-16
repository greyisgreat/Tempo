# Tempo — Precision Training Engine

A production-grade, AI-powered training plan generator built for Cloudflare Pages.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (design system via CSS variables) |
| Backend | Cloudflare Pages Functions (Edge) |
| AI Inference | Groq API (Llama 3.3 70B Versatile) |
| Algorithm | Custom deterministic engine (`tempoEngine.js`) |
| Deployment | Cloudflare Pages Direct Upload |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (frontend only — Functions require wrangler)
npm run dev

# Start full-stack local dev (requires wrangler installed globally)
npx wrangler pages dev dist --binding GROQ_API_KEY=your_key_here
```

For full local testing with the API route, you must run the wrangler dev server
pointing at the built `dist/` directory, **not** the Vite dev server alone.

**Recommended local flow:**

```bash
# Terminal 1 — watch build
npm run build -- --watch

# Terminal 2 — wrangler dev
npx wrangler pages dev dist --binding GROQ_API_KEY=gsk_your_key_here
```

---

## Production Deployment (Cloudflare Pages)

### Method A — Dashboard Direct Upload (Recommended)

1. Run `npm run build` — produces the `dist/` directory.
2. Zip the `dist/` folder contents (not the folder itself).
3. Go to Cloudflare Dashboard → Pages → Create project → Direct Upload.
4. Upload the zip.
5. In Pages → Settings → Environment Variables, add:
   - `GROQ_API_KEY` = your Groq API key (mark as Secret)
6. Redeploy after setting the environment variable.

### Method B — Wrangler CLI

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name tempo
```

Then set the secret:
```bash
wrangler pages secret put GROQ_API_KEY --project-name tempo
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key from https://console.groq.com |

Obtain a free Groq API key at [console.groq.com](https://console.groq.com).
The free tier supports ample requests for personal use.

---

## Architecture

```
tempo/
├── index.html                    # Vite HTML entry
├── vite.config.js                # Build configuration
├── wrangler.toml                 # Cloudflare Pages config
├── package.json
├── public/
│   ├── _redirects                # SPA fallback routing
│   └── robots.txt
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Root component + layout shell
│   ├── context/
│   │   └── AppContext.jsx        # Global state via useReducer
│   ├── components/
│   │   ├── Header.jsx            # Sticky nav + Reset Profile control
│   │   ├── OnboardingForm.jsx    # 4-step profile configuration
│   │   ├── GeneratingScreen.jsx  # Loading state UI
│   │   └── Dashboard.jsx        # Full plan rendering + macrocycle calendar
│   ├── utils/
│   │   └── tempoEngine.js       # Deterministic algorithm core
│   └── styles/
│       └── global.css           # Design system tokens + global rules
└── functions/
    └── api/
        └── generate.js          # Cloudflare Pages Function (POST /api/generate)
```

---

## Algorithm Logic (tempoEngine.js)

The deterministic engine converts profile inputs to structured training parameters:

- **Commitment Level (1–10)** → Training days per week
  - 1–3: 2 days / week (Full Body)
  - 4–7: 3 days / week (PPL)
  - 8–10: 5 days / week (Upper/Lower/PPL Hybrid)

- **Laziness Factor (1–10)** → Session density (inversely)
  - Low laziness: 7 exercises, 75 min sessions
  - Mid: 5 exercises, 55 min sessions
  - High: 3 compound exercises, 35 min sessions (Minimum Effective Dose)

- **Age** → Physiological protocol (Youth / Development / Prime / Masters I & II)
  - Deload frequency
  - Intensity ceiling modifier
  - Exercise selection guidance

- **Time Horizon** → Macrocycle week structure
  - Phases: Accumulation → Intensification → Realisation → Deload

This structured brief is passed alongside the AI prompt to Groq,
ensuring the LLM output is grounded in precise numeric parameters.

---

## Design System

- **Canvas**: `#0B0C10` (ultra-dark obsidian)
- **Surface**: `#1F2833` (dark matte slate)
- **Border**: `#2D3748` (hairline separation)
- **Text Primary**: `#C5C6C7` (silver-white)
- **Text Secondary**: `#66788A` (muted slate)
- **Accent**: `#45A29E` (desaturated metallic teal-grey)
- **Typography**: Inter (UI) + JetBrains Mono (data/code)
