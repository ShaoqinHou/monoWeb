# monoWeb

Mono repo hosting three projects: an interactive CV site and two live web apps that embed directly into it.

## Projects

### cv-web
Interactive web CV for Shaoqin Hou. Clean single page layout with all CV sections. Clicking a project opens a full screen detail view. The two apps below embed as live demos via iframe — click "Try it live" on their project cards to launch them inside the CV.

- **Tech:** React, TypeScript, Vite, Tailwind CSS
- **Port:** 3002

### pdf-ai-assistant
Client side PDF manipulation tool with an AI powered natural language interface. Users give commands like "Merge pages 1-2 of Report A with page 3 of Report B" and Gemini function calling chains the operations autonomously. All processing runs in browser, no server uploads.

- **Tech:** React, TypeScript, Vite, Tailwind CSS, Google Gemini API, pdf-lib, PDF.js, dnd-kit
- **Port:** 3001
- **Requires:** `GEMINI_API_KEY` in `.env.local`

### power-plan-ai-comparator
AI powered electricity plan comparison tool for the NZ energy market. Users draw hourly usage on an interactive graph and compare costs across 15+ provider plans. Paste a screenshot of any power plan and AI extracts the rates automatically.

- **Tech:** React, TypeScript, Vite, Tailwind CSS, Google Gemini API
- **Port:** 3000
- **Requires:** `GEMINI_API_KEY` in `.env.local`

## Development

### Install all

```bash
cd pdf-ai-assistant && npm install && cd ..
cd power-plan-ai-comparator && npm install && cd ..
cd cv-web && npm install && cd ..
```

### Run all (three terminals)

```bash
# Terminal 1
cd pdf-ai-assistant && npm run dev

# Terminal 2
cd power-plan-ai-comparator && npm run dev

# Terminal 3
cd cv-web && npm run dev
```

All three must be running for the CV live demos to work. The cv-web app embeds the other two via iframe using `http://localhost:3001` and `http://localhost:3000` in dev mode.

### Build each

```bash
cd pdf-ai-assistant && npm run build      # outputs to pdf-ai-assistant/dist/
cd power-plan-ai-comparator && npm run build  # outputs to power-plan-ai-comparator/dist/
cd cv-web && npm run build                # outputs to cv-web/dist/
```

## Deploy (all together)

When deployed, the CV app expects the other two apps to be served as subpaths on the same domain:

```
yoursite.com/                     → cv-web
yoursite.com/pdf-ai-assistant/    → pdf-ai-assistant
yoursite.com/power-plan-ai-comparator/ → power-plan-ai-comparator
```

The cv-web app automatically switches iframe URLs from localhost ports (dev) to these relative paths (production).

### Steps

1. Set the `base` option in each app's `vite.config.ts` for production subpaths:

   **pdf-ai-assistant/vite.config.ts** — add `base: '/pdf-ai-assistant/'`

   **power-plan-ai-comparator/vite.config.ts** — add `base: '/power-plan-ai-comparator/'`

   **cv-web/vite.config.ts** — leave as default (`/`)

2. Build all three:

   ```bash
   cd pdf-ai-assistant && npm run build
   cd ../power-plan-ai-comparator && npm run build
   cd ../cv-web && npm run build
   ```

3. Assemble into a single output directory:

   ```bash
   mkdir -p deploy
   cp -r cv-web/dist/* deploy/
   cp -r pdf-ai-assistant/dist deploy/pdf-ai-assistant
   cp -r power-plan-ai-comparator/dist deploy/power-plan-ai-comparator
   ```

4. Serve the `deploy/` folder with any static host (Nginx, Cloudflare Pages, Vercel, Netlify, etc.). All three apps are static — no server needed.

### Environment variables

Both pdf-ai-assistant and power-plan-ai-comparator need a `GEMINI_API_KEY`. In production these are baked in at build time via Vite's `define` config. Set the env var before building:

```bash
export GEMINI_API_KEY=your_key_here
```

Or create a `.env.local` file in each project directory:

```
GEMINI_API_KEY=your_key_here
```
