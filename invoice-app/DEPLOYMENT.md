# Deployment Guide

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────┐
│   Web (Static SPA)  │────▶│   API (Hono + Node)  │
│   Vite build output │     │   SQLite (file-based) │
│   Served by nginx   │     │   Port 3001           │
│   or any static host│     └──────────────────────┘
└─────────────────────┘
```

| Component | Tech | Build Output | Runtime |
|-----------|------|-------------|---------|
| Web SPA | Vite + React 19 | `packages/web/dist/` (static HTML/JS/CSS) | Any static file server |
| API Server | Hono + Node.js | Runs TypeScript via `tsx` | Node.js 20+ |
| Database | SQLite + Drizzle | `packages/api/data/app.db` | File on disk |
| Shared | Zod schemas | No separate build (imported at runtime) | — |

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20.x or later |
| npm | 10.x or later (ships with Node) |
| Git | Any recent version |

---

## Linux Deployment

### 1. Clone and install

```bash
git clone <repo-url> /opt/invoice-app
cd /opt/invoice-app
npm install
```

### 2. Build the web SPA

```bash
npm run build --workspace=packages/web
```

This produces static files in `packages/web/dist/`.

### 3. Initialize the database

```bash
mkdir -p packages/api/data
cd packages/api
npx drizzle-kit push
```

This creates `packages/api/data/app.db` with all tables.

### 4. Seed demo data (optional)

```bash
cd /opt/invoice-app
npx tsx packages/api/src/db/seed.ts
```

### 5. Run the API server

**Option A: Direct (testing)**

```bash
cd /opt/invoice-app
npx tsx packages/api/src/index.ts
```

**Option B: systemd service (production)**

Create `/etc/systemd/system/invoice-api.service`:

```ini
[Unit]
Description=Invoice App API Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/invoice-app
ExecStart=/usr/bin/npx tsx packages/api/src/index.ts
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable invoice-api
sudo systemctl start invoice-api
sudo systemctl status invoice-api
```

### 6. Serve the web SPA with nginx

Install nginx:

```bash
sudo apt install nginx    # Debian/Ubuntu
sudo dnf install nginx    # Fedora/RHEL
```

Create `/etc/nginx/sites-available/invoice-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;    # or localhost

    # Serve the built SPA
    root /opt/invoice-app/packages/web/dist;
    index index.html;

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Hono server
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and start:

```bash
sudo ln -s /etc/nginx/sites-available/invoice-app /etc/nginx/sites-enabled/
sudo nginx -t                # test config
sudo systemctl restart nginx
```

### 7. Verify

```bash
curl http://localhost/api/invoices    # API responds
curl http://localhost/                # SPA loads
```

### 8. HTTPS (optional but recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Windows Deployment

### 1. Clone and install

```powershell
git clone <repo-url> C:\invoice-app
cd C:\invoice-app
npm install
```

### 2. Build the web SPA

```powershell
npm run build --workspace=packages/web
```

### 3. Initialize the database

```powershell
mkdir packages\api\data -Force
cd packages\api
npx drizzle-kit push
cd ..\..
```

### 4. Seed demo data (optional)

```powershell
npx tsx packages/api/src/db/seed.ts
```

### 5. Run the API server

**Option A: Direct (testing)**

```powershell
npx tsx packages/api/src/index.ts
```

**Option B: Windows Service with NSSM (production)**

Download [NSSM](https://nssm.cc/download) and install as a service:

```powershell
# Download nssm and place in PATH, then:
nssm install InvoiceAPI "C:\Program Files\nodejs\npx.cmd" "tsx packages/api/src/index.ts"
nssm set InvoiceAPI AppDirectory "C:\invoice-app"
nssm set InvoiceAPI AppEnvironmentExtra "NODE_ENV=production"
nssm set InvoiceAPI DisplayName "Invoice App API"
nssm set InvoiceAPI Description "Hono API server for Invoice App"
nssm set InvoiceAPI Start SERVICE_AUTO_START
nssm start InvoiceAPI
```

**Option C: PM2 (cross-platform process manager)**

```powershell
npm install -g pm2
pm2 start "npx tsx packages/api/src/index.ts" --name invoice-api --cwd C:\invoice-app
pm2 save
pm2 startup    # follow instructions for auto-start
```

### 6. Serve the web SPA

**Option A: IIS (Windows native)**

1. Install IIS via "Turn Windows features on or off" > Internet Information Services
2. Install the [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) module
3. Create a new site pointing to `C:\invoice-app\packages\web\dist`
4. Add `web.config` to `packages/web/dist/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <!-- SPA fallback -->
    <rewrite>
      <rules>
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <!-- Cache static assets -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
    </staticContent>
  </system.webServer>
</configuration>
```

Note: IIS API proxy requires the [Application Request Routing](https://www.iis.net/downloads/microsoft/application-request-routing) module.

**Option B: nginx for Windows**

1. Download [nginx for Windows](https://nginx.org/en/download.html)
2. Extract to `C:\nginx`
3. Edit `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;

    server {
        listen 80;
        server_name localhost;

        root C:/invoice-app/packages/web/dist;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:3001;
        }
    }
}
```

4. Start nginx:

```powershell
cd C:\nginx
start nginx
```

**Option C: serve (quick and simple)**

```powershell
npm install -g serve
serve -s C:\invoice-app\packages\web\dist -l 5174
```

Note: `serve` does not proxy `/api` requests. Use this only if the API is accessed directly on port 3001.

### 7. Verify

```powershell
Invoke-WebRequest http://localhost:3001/api/invoices    # API
Invoke-WebRequest http://localhost/                      # SPA
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | Set to `production` in deployment |
| `DB_PATH` | `./data/app.db` | SQLite database file path |

To use `PORT` and `DB_PATH`, update `packages/api/src/index.ts`:

```typescript
const port = parseInt(process.env.PORT || '3001', 10);
const dbPath = process.env.DB_PATH || './data/app.db';
```

---

## Updating

```bash
cd /opt/invoice-app          # or C:\invoice-app on Windows
git pull
npm install
npm run build --workspace=packages/web
npx drizzle-kit push --config=packages/api/drizzle.config.ts

# Restart the API
sudo systemctl restart invoice-api    # Linux
nssm restart InvoiceAPI               # Windows (NSSM)
pm2 restart invoice-api               # PM2
```

Nginx / IIS picks up the new static files automatically (no restart needed).

---

## Backup

The only stateful file is the SQLite database:

```bash
# Linux
cp /opt/invoice-app/packages/api/data/app.db /backups/app-$(date +%F).db

# Windows (PowerShell)
Copy-Item C:\invoice-app\packages\api\data\app.db "C:\backups\app-$(Get-Date -Format yyyy-MM-dd).db"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `EADDRINUSE: port 3001` | Another process is using the port. Kill it or change `PORT` |
| `better-sqlite3` build fails | Install build tools: `sudo apt install build-essential python3` (Linux) or `npm install -g windows-build-tools` (Windows) |
| SPA shows blank page | Check that nginx/IIS has the SPA fallback rule (all routes serve `index.html`) |
| API returns 404 for `/api/*` | Check reverse proxy config points to `http://127.0.0.1:3001` |
| Database locked errors | Ensure only one API process accesses the SQLite file. WAL mode is enabled by default |
| `tsx` not found | Run `npm install` in the project root to install dev dependencies |
