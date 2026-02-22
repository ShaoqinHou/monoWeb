# monoWeb

Mono repo hosting an interactive CV site and several live web apps that embed directly into it. Some sub-apps live in their own repos and are linked here as **git submodules**.

## Projects

### cv-web
Interactive web CV for Shaoqin Hou. Clean single page layout with all CV sections. Clicking a project opens a full screen detail view. The apps below embed as live demos via iframe — click "Try it live" on their project cards to launch them inside the CV.

- **Tech:** React, TypeScript, Vite, Tailwind CSS
- **Lives in:** this repo (direct)

### invoice-app _(submodule)_
1:1 replica of the Xero web application (UI + features). Full accounting app with invoices, bills, contacts, bank reconciliation, payroll, projects, and reporting.

- **Tech:** React, TypeScript, Vite, TanStack Router/Query, Hono API, SQLite, Drizzle
- **Repo:** [ShaoqinHou/invoice-app](https://github.com/ShaoqinHou/invoice-app)

### invoice-extractor _(submodule)_
AI-powered invoice processing app. Upload PDF invoices, AI extracts structured data (vendor, amounts, line items), human reviews and approves.

- **Tech:** React, TypeScript, Vite, Hono API, SQLite, Anthropic/Google AI
- **Repo:** [ShaoqinHou/invoice-extractor](https://github.com/ShaoqinHou/invoice-extractor)

### pdf-ai-assistant
Client-side PDF manipulation tool with an AI-powered natural language interface. All processing runs in browser, no server uploads.

- **Tech:** React, TypeScript, Vite, Tailwind CSS, Google Gemini API, pdf-lib, PDF.js
- **Lives in:** this repo (direct)
- **Requires:** `GEMINI_API_KEY` in `.env.local`

### power-plan-ai-comparator
AI-powered electricity plan comparison tool for the NZ energy market.

- **Tech:** React, TypeScript, Vite, Tailwind CSS, Google Gemini API
- **Lives in:** this repo (direct)
- **Requires:** `GEMINI_API_KEY` in `.env.local`

---

## Git Submodules Workflow

`invoice-app` and `invoice-extractor` are git submodules — they have their own repos but appear as directories inside monoWeb.

### Clone (first time)

```bash
# Always use --recurse-submodules, otherwise submodule dirs will be empty
git clone --recurse-submodules https://github.com/ShaoqinHou/monoWeb.git
```

If you already cloned without `--recurse-submodules`:
```bash
git submodule update --init --recursive
```

### Develop inside a sub-app

Sub-app directories are full git repos. Just `cd` in and work normally:

```bash
cd invoice-app
# edit files...
git add -A && git commit -m "Fix something" && git push
```

This pushes to the sub-app's own repo (e.g. `ShaoqinHou/invoice-app`).

### Update monoWeb pointer after sub-app changes

After pushing changes inside a sub-app, monoWeb's pointer is outdated. Update it:

```bash
cd ..   # back to monoWeb root
git add invoice-app
git commit -m "Update invoice-app"
git push
```

### Pull latest sub-app changes (from another machine or contributor)

`git pull` on monoWeb does NOT auto-update submodules. You need:

```bash
git pull
git submodule update --init --recursive
```

Or to pull the latest from the sub-app's remote (even if monoWeb hasn't updated its pointer yet):

```bash
git submodule update --remote invoice-app
```

### Quick reference

| Task | Command |
|------|---------|
| Clone with submodules | `git clone --recurse-submodules <url>` |
| Init submodules after clone | `git submodule update --init --recursive` |
| Check submodule status | `git submodule status` |
| Pull latest sub-app from remote | `git submodule update --remote <name>` |
| Update monoWeb pointer | `git add <name> && git commit && git push` |
| See which commit submodule points to | `git submodule status` |

---

## Development

### Install

```bash
cd cv-web && npm install && cd ..
cd pdf-ai-assistant && npm install && cd ..
cd power-plan-ai-comparator && npm install && cd ..

# Submodules (if you need to run them locally)
cd invoice-app && npm install && cd ..
cd invoice-extractor && npm install && cd ..
```

### Run (dev)

```bash
# cv-web
cd cv-web && npm run dev

# Sub-apps (each in their own terminal)
cd invoice-app && npm run dev:all
cd invoice-extractor && npm run dev
```

### Build

```bash
cd cv-web && npm run build                         # outputs to cv-web/dist/
cd pdf-ai-assistant && npm run build               # outputs to pdf-ai-assistant/dist/
cd power-plan-ai-comparator && npm run build       # outputs to power-plan-ai-comparator/dist/
```

---

## Deploy

All apps are served under a single domain (`cv.rehou.games`):

```
cv.rehou.games/                          → cv-web
cv.rehou.games/invoice-app/              → invoice-app
cv.rehou.games/invoice-extractor/        → invoice-extractor
cv.rehou.games/pdf-ai-assistant/         → pdf-ai-assistant
cv.rehou.games/power-plan-ai-comparator/ → power-plan-ai-comparator
```

The cv-web app automatically switches iframe URLs from localhost (dev) to these relative paths (production).

### Environment variables

Both pdf-ai-assistant and power-plan-ai-comparator need a `GEMINI_API_KEY`. Set before building:

```bash
export GEMINI_API_KEY=your_key_here
```

Or create a `.env.local` file in each project directory.
