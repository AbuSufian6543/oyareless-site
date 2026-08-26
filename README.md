# WirelessCom.Ca Inc. — website & CMS

The corporate site for WirelessCom.Ca Inc. with a built-in content management
system, a Wix-style page builder, a live video stream manager, and a lead inbox.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, PostgreSQL and
Prisma. Ships as a Docker Compose stack designed to sit behind nginx.

---

## Deploy on Ubuntu in one command

On a fresh Ubuntu server, copy this folder to the machine and run:

```bash
sudo ./deploy.sh --domain wirelesscom.ca --domain www.wirelesscom.ca --tls --email you@wirelesscom.ca
```

That single command:

1. Installs Docker Engine and the Compose plugin from Docker's own repository.
2. Generates `.env` with a random database password and random signing secrets.
3. Builds the images and starts PostgreSQL and the application.
4. Applies the database schema and seeds every page, menu, and legacy redirect.
5. Installs and enables the nginx reverse proxy on port 80.
6. Requests a Let's Encrypt certificate and switches the site to HTTPS.
7. Prints the admin URL and the initial super admin password.

Other useful forms:

```bash
sudo ./deploy.sh                 # no domain yet — serves on the server's IP over HTTP
sudo ./deploy.sh --no-nginx      # you already have a proxy; app listens on 127.0.0.1:3000
sudo ./deploy.sh --bind 0.0.0.0  # expose the app port directly on every interface
./deploy.sh --update             # rebuild and restart after pulling new code
sudo ./deploy.sh --help          # all options
```

Re-running `deploy.sh` is safe. It never overwrites an existing `.env`, and the
seed only inserts records that are missing — anything edited in the admin is
left alone.

### Serving on a bare IP address

With no `--domain`, the site answers on the server's IP over plain HTTP and
`ALLOW_INSECURE_COOKIES` is set to `true` so sign-in works without TLS. The
nginx vhost is installed as `default_server` with `server_name _`, so it also
responds to any hostname pointed at the machine. Once you add a certificate,
`deploy.sh --tls` flips the cookie setting back to secure-only.

### If your nginx lives on another machine

Run `sudo ./deploy.sh --no-nginx --bind 0.0.0.0`, then point your proxy at
`http://<server-ip>:3000`. `docker/nginx/wirelesscom.conf.template` is a good
starting configuration — copy the `location /` block from it, since streaming
and file uploads need `proxy_buffering off` and a raised `client_max_body_size`.

---

## After the first deploy

1. **Save the super admin password** that `deploy.sh` prints. It is shown once.
2. **Add SMTP credentials.** Edit `.env`, fill in `SMTP_HOST`, `SMTP_PORT`,
   `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` and `SMTP_TO`, then run
   `docker compose up -d app`. Until this is done, form submissions are still
   captured in the admin inbox — they just are not emailed out.
3. **Turn on two-factor authentication** under *Admin → My account*.
4. **Check Settings** — phone, address, hours and social links all live in
   *Admin → Settings*, so no redeploy is needed to change them.
5. **Add your live stream URLs.** One example stream is seeded as a draft with a
   placeholder source; replace the URL and publish it.

---

## What the admin can do

| Section | Capability |
| --- | --- |
| Pages | Create, edit, duplicate, publish and delete pages with the block builder. Revision history with one-click restore. |
| Blocks | 27 section types — hero, service grids, feature grids, rich text, stats, image + text, FAQ, testimonials, logo strips, CTAs, forms, video, live stream, embeds, speed test, and more. |
| News | Articles built from the same blocks, with tags, cover images and scheduled publishing. |
| Careers | Job postings with requirements, salary range and closing dates. Emits `JobPosting` structured data. |
| Live streams | HLS, DASH, MJPEG and embeds (YouTube, Vimeo, Twitch, Facebook). Public, unlisted or password-protected. |
| Media | Upload and manage images, SVGs and PDFs. Raster images are resized and re-encoded; SVGs are sanitised. |
| Submissions | Inbox for contact, support, quote and callback forms with status triage, assignment, internal notes and CSV export. |
| Subscribers | Double opt-in newsletter list with CSV export. |
| Navigation | Header, footer and utility menus with drag-free ordering and nested children. |
| Redirects | Add 301s at any time without a deploy. |
| Settings | Company details, contact info, announcement bar, social links, analytics snippet, cookie banner. |
| Users | Create staff accounts across four roles, reset passwords, disable 2FA, and promote other super admins. |
| Audit log | Who changed what, and when. |

### Roles

| Role | Can do |
| --- | --- |
| `VIEWER` | Read the admin panel |
| `EDITOR` | Edit content, media and submissions |
| `ADMIN` | Everything above plus settings, navigation, redirects and deletions |
| `SUPERADMIN` | Everything, including user management and creating other super admins |

---

## Local development

Requires Node.js 22+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate deploy
npm run seed
npm run dev
```

If you do not have PostgreSQL to hand, `npx prisma dev` starts a local one and
prints a `DATABASE_URL` you can paste into `.env`.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run check:blocks` | Validate every block type and all seed content — no database needed |
| `npm run check:smoke -- http://127.0.0.1:3000 admin@example.com 'password'` | Sign in and request every public and admin route against a running server |
| `npm run seed` | Insert any missing seed content |

---

## Operations

```bash
docker compose ps                    # container status
docker compose logs -f app           # application logs
docker compose logs migrate          # schema and seed output from the last deploy
docker compose restart app           # restart just the app
./deploy.sh --update                 # rebuild and restart after a code change
./backup.sh                          # dump the database and uploaded media to ./backups
./backup.sh --restore ./backups/wirelesscom-20260826-101500
```

A nightly backup via root's crontab:

```
15 2 * * * /opt/wirelesscom/backup.sh /mnt/backups >> /var/log/wc-backup.log 2>&1
```

### Layout

```
prisma/
  schema.prisma        database schema
  migrations/          committed SQL, applied by `prisma migrate deploy`
  seed-content.ts      every page's content, the menus, and the legacy redirects
  seed.ts              idempotent seeding
src/
  app/(site)/          public pages
  app/admin/           CMS
  app/api/             forms, subscribe, media, exports, speed test, health
  components/blocks/   block renderers
  components/admin/    page builder and admin UI
  lib/                 auth, blocks, settings, mail, uploads, SEO helpers
  proxy.ts             301s from the legacy .html URLs
docker/
  migrate.sh           schema + seed job run before the app starts
  nginx/               reverse proxy template used by deploy.sh
deploy.sh              one-shot installer
backup.sh              backup and restore
```

The stack runs three services: `db` (PostgreSQL 17), `migrate` (one-shot schema
and seed, must exit successfully before the app starts) and `app` (the Next.js
standalone server). Uploaded media and database files each live on a named
Docker volume, so `docker compose down` does not lose data.

---

## Security notes

- Passwords are hashed with bcrypt (cost 12) and must be at least 12 characters
  with mixed case, a digit and a symbol.
- Sessions are opaque tokens in a signed, `HttpOnly`, `SameSite=Lax` cookie;
  only a hash of the token is stored server-side.
- TOTP secrets and recovery codes are encrypted at rest with AES-256-GCM.
- Failed logins are recorded and rate-limited per account and per IP.
- Public form endpoints are rate-limited and honeypot-protected.
- Uploaded SVGs are parsed and rejected if they contain scripts or event
  handlers; raster images are re-encoded rather than stored as received.
- `.env` holds the database password and both signing secrets. `deploy.sh`
  writes it `chmod 600`; keep it out of version control and off shared drives.

---

## Migrated content

Every page, service description, phone number and image from wirelesscom.org was
brought across: 18 pages, the full services menu, the privacy policy and the
E-911 notice, plus 21 redirects covering the legacy `.html` URLs and old paths so
existing search rankings and bookmarks keep working. `sitemap.xml` and
`robots.txt` are generated from the live database.

## Ideas for later

Worth considering once the site is live:

- **Client portal** — let contract customers see their own cameras, open
  tickets, and invoices behind a login. The role system and password-protected
  streams already provide most of the scaffolding.
- **Online booking** — a "book a site survey" calendar instead of a callback
  form.
- **Service status page** — publish planned maintenance and outages; useful for
  the internet and VoIP customers.
- **Knowledge base** — searchable how-to articles to reduce support calls.
- **Quote builder** — a guided form that prices common packages (cameras,
  phones, cabling) and emails a PDF.
- **Live chat** — the settings already carry a `showLiveChatCta` toggle for
  wiring one in.
- **Bilingual content** — English and French versions of each page for
  Northern Ontario municipal and federal clients.
