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
| `grid-puzzles/` | Submodule | ShaoqinHou/grid-puzzles | Grid logic puzzle games (Nonograms, etc.) |
| `nexus/` | Submodule | ShaoqinHou/nexus | Multi-tenant mini-app platform (Hono + SQLite + React) |
| `hex-empires/` | Submodule | ShaoqinHou/hex-empires | Civ VII-inspired strategy game (TypeScript engine + React/Canvas) |

**Direct folders** are part of this repo. **Submodules** have their own repos, CLAUDE.md, and git history.

## Working with Claude Code CLI

- **Direct folders** (`cv-web`, `pdf-ai-assistant`, `power-plan-ai-comparator`): work from monoWeb root.
- **Submodules** (`invoice-app`, `invoice-extractor`, `codegraph`, `flow-cards`, `grid-puzzles`, `nexus`, `hex-empires`): open Claude Code **inside the submodule directory** (`cd invoice-app && claude`). Each has its own CLAUDE.md with project-specific rules.

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
cd grid-puzzles && MSYS_NO_PATHCONV=1 npx vite build --base /grid-puzzles/
cd flow-cards && MSYS_NO_PATHCONV=1 npx vite build --base /flow-cards/
cd nexus/packages/web && MSYS_NO_PATHCONV=1 npx vite build --base /nexus/
```

## Deployment

Server: `134.199.148.87` (SSH key `~/.ssh/DIOkii`, user `root`)

```
cv.rehou.games/                          → cv-web (static)
cv.rehou.games/invoice-app/              → invoice-app (static + API on port 3004)
cv.rehou.games/invoice-extractor/        → invoice-extractor (static + API on port 3006)
cv.rehou.games/pdf-ai-assistant/         → pdf-ai-assistant (static)
cv.rehou.games/power-plan-ai-comparator/ → power-plan-ai-comparator (static)
cv.rehou.games/grid-puzzles/             → grid-puzzles (static)
cv.rehou.games/flow-cards/               → flow-cards (static + push API on port 3008)
cv.rehou.games/nexus/                    → nexus (static + API on port 3010)
```

- Nginx config: `/etc/nginx/sites-available/cv.rehou.games`
  - Nexus API location block requires SSE directives (`proxy_buffering off`, `proxy_read_timeout 3600s`, `proxy_set_header Connection ""`, `chunked_transfer_encoding off`) for the kitchen display real-time stream to work
- API services: systemd (`invoice-app-api` on 3004, `invoice-extractor-api` on 3006, `flowcards-push` on 3008, `nexus-api` on 3010)
- API code on server: `/root/monoWeb/`
- Static frontends: `/var/www/cv.rehou.games/{app}/`
- `flow-cards` is a **private repo** — server uses SSH deploy key (`~/.ssh/flow-cards-deploy`, alias `github-flow-cards`). Pull with: `cd /root/monoWeb/flow-cards && git pull`

### nexus deploy sequence (full)

After merging changes to `main` and pushing:

```bash
# 1. Local: build with subpath
cd nexus/packages/web && MSYS_NO_PATHCONV=1 npx vite build --base /nexus/

# 2. Local: package + upload (rsync isn't on MINGW, so tarball it)
tar -czf /tmp/nexus-dist.tar.gz -C nexus/packages/web/dist .
scp -i ~/.ssh/DIOkii /tmp/nexus-dist.tar.gz root@134.199.148.87:/tmp/

# 3. Server: pull, install, MIGRATE DB, restart, extract static
ssh -i ~/.ssh/DIOkii root@134.199.148.87 "
  cd /root/monoWeb/nexus &&
  git pull origin main &&
  npm install --workspace=packages/api &&
  cd packages/api && npm run db:push -- --force &&    # ← critical, do not skip
  systemctl restart nexus-api &&
  rm -rf /var/www/cv.rehou.games/nexus/* &&
  tar -xzf /tmp/nexus-dist.tar.gz -C /var/www/cv.rehou.games/nexus/ &&
  rm /tmp/nexus-dist.tar.gz
"

# 4. Verify
curl -s https://cv.rehou.games/nexus/ | grep -o 'index-[A-Za-z0-9_-]*\.js' | head -1
curl -s -o /dev/null -w "%{http_code}\n" "https://cv.rehou.games/nexus/api/order/demo/ordering/menu?lang=zh"
```

**`db:push` is critical.** Skipping it leaves the production DB schema lagging behind code, causing `SqliteError: no such column` 500s once any new column is referenced (this happened during design-workflow-v2 deploy with `content_translations.source`).

## Platform Notes

- Use `python` not `python3` on Windows (MINGW redirects `python3` to MS Store)
- Always prefix `MSYS_NO_PATHCONV=1` before commands with `--base /path/` on Git Bash
- Hardcoded `/api/` in fetch calls breaks under subpath deployments — use relative paths
- Always commit server-side fixes to git (SFTP-only fixes get lost on rebuild)
