# monoWeb

Monorepo hosting an interactive CV site and several live web apps. All served under `cv.rehou.games`.

## Repo Structure

| Folder | Type | Repo | Description |
|--------|------|------|-------------|
| `cv-web/` | Direct | monoWeb | Interactive CV site (React/Vite/Tailwind) |
| `pdf-ai-assistant/` | Direct | monoWeb | Client-side PDF tool with Gemini AI |
| `power-plan-ai-comparator/` | Direct | monoWeb | NZ energy plan comparator with Gemini AI |
| `invoice-app/` | Submodule | ShaoqinHou/invoice-app | Xero replica (Hono + SQLite + React) |
| `invoice-extractor/` | Submodule | ShaoqinHou/invoice-extractor | AI invoice processor (Hono + SQLite + React) |
| `codegraph/` | Submodule | ShaoqinHou/codegraph | TypeScript codebase fact extractor |
| `flow-cards/` | Submodule | ShaoqinHou/flow-cards | Flow-based card scheduling app |

**Direct folders** are part of this repo. **Submodules** have their own repos, CLAUDE.md, and git history.

## Working with Claude Code CLI

- **Direct folders** (`cv-web`, `pdf-ai-assistant`, `power-plan-ai-comparator`): work from monoWeb root.
- **Submodules** (`invoice-app`, `invoice-extractor`, `codegraph`, `flow-cards`): open Claude Code **inside the submodule directory** (`cd invoice-app && claude`). Each has its own CLAUDE.md with project-specific rules.

## Submodule Workflow

After making changes inside a submodule:

```bash
# 1. Inside the submodule — commit and push
cd invoice-app
git add -A && git commit -m "Fix something" && git push

# 2. Back in monoWeb root — update the pointer
cd ..
git add invoice-app
git commit -m "Update invoice-app submodule"
git push
```

Pulling on another machine:

```bash
git pull
git submodule update --init --recursive
```

## Build Commands

All Vite builds with `--base` on MINGW/Git Bash need the path conversion fix:

```bash
# cv-web (no base path needed — serves at root)
cd cv-web && npm run build

# Subpath apps
cd invoice-app/packages/web && MSYS_NO_PATHCONV=1 npx vite build --base /invoice-app/
cd invoice-extractor/packages/web && MSYS_NO_PATHCONV=1 npx vite build --base /invoice-extractor/
cd pdf-ai-assistant && npm run build
cd power-plan-ai-comparator && npm run build
```

## Deployment

Server: `134.199.148.87` (SSH key `~/.ssh/DIOkii`, user `root`)

```
cv.rehou.games/                          → cv-web (static)
cv.rehou.games/invoice-app/              → invoice-app (static + API on port 3004)
cv.rehou.games/invoice-extractor/        → invoice-extractor (static + API on port 3006)
cv.rehou.games/pdf-ai-assistant/         → pdf-ai-assistant (static)
cv.rehou.games/power-plan-ai-comparator/ → power-plan-ai-comparator (static)
```

- Nginx config: `/etc/nginx/sites-available/cv.rehou.games`
- API services: systemd (`invoice-app-api` on 3004, `invoice-extractor-api` on 3006)
- API code on server: `/root/monoWeb/`
- Static frontends: `/var/www/cv.rehou.games/{app}/`

## Platform Notes

- Use `python` not `python3` on Windows (MINGW redirects `python3` to MS Store)
- Always prefix `MSYS_NO_PATHCONV=1` before commands with `--base /path/` on Git Bash
- Hardcoded `/api/` in fetch calls breaks under subpath deployments — use relative paths
- Always commit server-side fixes to git (SFTP-only fixes get lost on rebuild)
