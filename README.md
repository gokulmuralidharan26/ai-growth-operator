# AI Growth Operator
### Omnia1 Growth OS v2 — Experiment Intelligence Layer

A production-quality AI-powered performance marketing OS for beauty, wellness, and fashion DTC brands. Diagnoses campaign issues, generates action plans, runs experiments, tracks outcomes, and surfaces pattern intelligence from historical runs.

---

## What's New in v2

| Feature | Description |
|---|---|
| **Persistent DB** | SQLite + Prisma — every analysis run and experiment saved automatically |
| **Risk Radar** | AI-generated risk score (0–100) with metric-grounded risk drivers |
| **Experiment Library** | Track experiments from Proposed → Running → Completed with outcome recording |
| **Memory Tab** | Pattern matching — similar past cases + winning experiments from your history |
| **Weekly Memo** | One-click structured client memo — copy or download as `.md` |
| **5 Result Tabs** | Diagnosis · Action Plan · Experiments · Creative · Memory |

---

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma 5 + SQLite** (local DB, no external services)
- **Zod v4** — strict schema validation with auto-retry on bad AI output
- **OpenAI SDK** — server-side only via UF NaviGator Toolkit or direct OpenAI
- **lucide-react** icons

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# UF NaviGator Toolkit (OpenAI-compatible)
NAVIGATOR_TOOLKIT_API_KEY=sk-your-key-here
NAVIGATOR_BASE_URL=https://api.ai.it.ufl.edu/v1
OPENAI_MODEL=gpt-oss-120b

# SQLite database (auto-created)
DATABASE_URL="file:./dev.db"
```

### 3. Run database migration

```bash
npx prisma migrate dev --name init
```

This creates `dev.db` at the project root with all tables.

### 4. Generate Prisma client (if not already done)

```bash
npx prisma generate
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How to Use Growth OS v2

### Running an Analysis
1. Fill in the **Campaign Snapshot** form (or use **Load Scenario** for a preset)
2. Click **Analyze Performance** — analysis is saved to the DB automatically
3. Review the 5 result tabs

### Tracking Experiments
In the **Experiments** tab, each AI-generated experiment is auto-saved to the library:
- **Mark Running** → set status to Running when you launch
- **Record Outcome** → opens modal to log Win/Loss/Neutral/Inconclusive + metric deltas + learnings

### Memory & Pattern Matching
The **Memory** tab shows:
- Up to 3 similar past runs (scored by bottleneck match, confidence band, trend direction)
- **Compare with Current** — inline diff of bottleneck types and risk scores
- **Top Winning Experiments** from similar cases — with learnings surfaced

### Client Memo
Click **Client Memo** in the results header to generate a full weekly growth report:
- Performance Summary, Likely Drivers, Actions, Experiments, Creative Direction, Risks
- Copy to clipboard or download as `.md`

### Export JSON
**Export JSON** (header) downloads: snapshot + computed metrics + full AI analysis + risk + timestamp.

### Simulation Mode
Toggle **Sim Mode** in the header to run with mock data — no API key needed.

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Run analysis, save to DB, return result + runId |
| `/api/history` | GET | Last 10 analysis runs |
| `/api/similar?runId=` | GET | Top 3 similar past runs + similarity scores |
| `/api/experiments/:id/status` | POST | Update experiment status |
| `/api/experiments/:id/outcome` | POST | Record outcome, mark Completed |

---

## Database Schema

```
AnalysisRun      — Every analysis saved with full AI output
Experiment       — Each proposed experiment linked to its run
ExperimentOutcome — Outcome records (Win/Loss/Neutral/Inconclusive)
```

Run `npx prisma studio` to browse the database in a web UI.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NAVIGATOR_TOOLKIT_API_KEY` | Yes (or `OPENAI_API_KEY`) | API key for AI calls |
| `NAVIGATOR_BASE_URL` | No | NaviGator base URL (default: UF endpoint) |
| `OPENAI_API_KEY` | Yes (or Navigator) | Direct OpenAI alternative |
| `OPENAI_MODEL` | No | Model to use (default: `gpt-oss-120b` / `gpt-4o`) |
| `DATABASE_URL` | Yes | SQLite path (`file:./dev.db`) |

---

## Dev Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npx prisma studio    # Browse database
npx prisma migrate dev --name <name>  # Run new migration
npx prisma generate  # Regenerate Prisma client after schema change
```

---

## JSON Export Format (v2)

```json
{
  "exportedAt": "ISO timestamp",
  "version": "2.0",
  "snapshot": { "brandName": "...", "industry": "...", ... },
  "computed": { "roas": 2.1, "cpc": 1.25, "estimatedCac": 47.62 },
  "analysis": {
    "summary": { "oneLiner": "..." },
    "bottlenecks": [...],
    "primaryBottleneck": "Creative",
    "confidence": 0.82,
    "risk": { "riskScore": 62, "riskDrivers": ["..."] },
    "actionPlan": [...],
    "experiments": [{ "category": "Creative", "name": "...", ... }],
    "creativeDirections": { "angles": [...], "hooks": [...], "ctas": [...] }
  }
}
```
