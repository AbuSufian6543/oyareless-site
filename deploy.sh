#!/usr/bin/env bash
# ===========================================================================
# WirelessCom.Ca Inc. — one-shot deployment
#
# Run this once on a fresh Ubuntu machine. It installs Docker, generates
# secrets into .env, builds the images, runs migrations and the seed, brings
# the stack up, and optionally configures nginx + a Let's Encrypt certificate.
#
#   sudo ./deploy.sh
#   sudo ./deploy.sh --domain wirelesscom.ca --domain www.wirelesscom.ca --tls
#   sudo ./deploy.sh --no-nginx            # app only, proxy lives elsewhere
#   ./deploy.sh --update                   # rebuild and restart, keep .env
#
# Re-running is safe: an existing .env is never overwritten and the seed never
# touches records that have been edited in the admin.
# ===========================================================================

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

# --- Defaults --------------------------------------------------------------
DOMAINS=()
APP_PORT="3000"
APP_BIND="127.0.0.1"
CONFIGURE_NGINX=1
CONFIGURE_TLS=0
TLS_EMAIL=""
UPDATE_ONLY=0
RUN_SEED="true"
ASSUME_YES=0
SUPERADMIN_EMAIL="abu@wirelesscom.ca"
SUPERADMIN_PASSWORD=""
SUPERADMIN_NAME="Abu"

NGINX_SITE="wirelesscom"
ENV_FILE="$REPO_DIR/.env"

# --- Output ----------------------------------------------------------------
if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_BLUE=$'\033[34m'
  C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_RED=$'\033[31m'
else
  C_RESET=""; C_BOLD=""; C_BLUE=""; C_GREEN=""; C_YELLOW=""; C_RED=""
fi

step() { printf '\n%s==>%s %s%s%s\n' "$C_BLUE" "$C_RESET" "$C_BOLD" "$1" "$C_RESET"; }
info() { printf '    %s\n' "$1"; }
ok()   { printf '    %s✓%s %s\n' "$C_GREEN" "$C_RESET" "$1"; }
warn() { printf '    %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$1"; }
die()  { printf '\n%sError:%s %s\n\n' "$C_RED" "$C_RESET" "$1" >&2; exit 1; }

usage() {
  cat <<'EOF'
WirelessCom.Ca Inc. — one-shot deployment

Run this once on a fresh Ubuntu machine. It installs Docker, generates secrets
into .env, builds the images, runs migrations and the seed, brings the stack up,
and optionally configures nginx and a Let's Encrypt certificate.

  sudo ./deploy.sh
  sudo ./deploy.sh --domain wirelesscom.ca --domain www.wirelesscom.ca --tls
  sudo ./deploy.sh --no-nginx            # app only, proxy lives elsewhere
  ./deploy.sh --update                   # rebuild and restart, keep .env

Re-running is safe: an existing .env is never overwritten and the seed never
touches records that have been edited in the admin.

Options
  --domain NAME        Domain to serve (repeat for more). The site also always
                       answers on the machine's bare IP address.
  --port PORT          Host port the container publishes on (default 3000)
  --bind ADDRESS       Host address to bind (default 127.0.0.1; use 0.0.0.0 to
                       expose the app directly without nginx)
  --no-nginx           Skip nginx configuration entirely
  --tls                Request a Let's Encrypt certificate with certbot
  --email ADDRESS      Contact address for Let's Encrypt (implies --tls)
  --superadmin-email ADDRESS
  --superadmin-password PASSWORD
                       Initial super admin credentials. Omit the password and a
                       strong one is generated and printed once.
  --no-seed            Do not seed starter content
  --update             Rebuild and restart using the existing .env
  --yes, -y            Do not prompt for anything
  --help, -h           Show this help
EOF
}

# --- Arguments -------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)              DOMAINS+=("${2:?--domain needs a value}"); shift 2 ;;
    --port)                APP_PORT="${2:?--port needs a value}"; shift 2 ;;
    --bind)                APP_BIND="${2:?--bind needs a value}"; shift 2 ;;
    --no-nginx)            CONFIGURE_NGINX=0; shift ;;
    --tls)                 CONFIGURE_TLS=1; shift ;;
    --email)               TLS_EMAIL="${2:?--email needs a value}"; CONFIGURE_TLS=1; shift 2 ;;
    --superadmin-email)    SUPERADMIN_EMAIL="${2:?--superadmin-email needs a value}"; shift 2 ;;
    --superadmin-password) SUPERADMIN_PASSWORD="${2:?--superadmin-password needs a value}"; shift 2 ;;
    --no-seed)             RUN_SEED="false"; shift ;;
    --update)              UPDATE_ONLY=1; shift ;;
    -y|--yes)              ASSUME_YES=1; shift ;;
    -h|--help)             usage; exit 0 ;;
    *)                     die "Unknown option: $1 (try --help)" ;;
  esac
done

# --- Helpers ---------------------------------------------------------------
SUDO=""
if [[ "$(id -u)" -ne 0 ]]; then
  command -v sudo >/dev/null 2>&1 || die "Run as root or install sudo."
  SUDO="sudo"
fi

as_root() { if [[ -n "$SUDO" ]]; then $SUDO "$@"; else "$@"; fi; }

random_secret() { openssl rand -base64 48 | tr -d '\n=' | tr '+/' 'Aa'; }
random_password() { openssl rand -base64 24 | tr -d '\n=' | tr '+/' 'Xy'; }

compose() { as_root docker compose "$@"; }

confirm() {
  [[ "$ASSUME_YES" -eq 1 ]] && return 0
  local reply
  read -r -p "    $1 [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

primary_domain() {
  if [[ ${#DOMAINS[@]} -gt 0 ]]; then printf '%s' "${DOMAINS[0]}"; else printf ''; fi
}

detect_public_ip() {
  local ip
  ip="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  [[ -n "$ip" ]] || ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  printf '%s' "$ip"
}

# ===========================================================================
step "Checking the host"

if [[ ! -f /etc/os-release ]]; then
  warn "Cannot identify the OS; assuming a Debian/Ubuntu-compatible system."
else
  . /etc/os-release
  info "Detected ${PRETTY_NAME:-unknown}"
  case "${ID_LIKE:-$ID}" in
    *debian*|*ubuntu*) : ;;
    *) warn "This script targets Ubuntu/Debian. Package installation may fail." ;;
  esac
fi

for tool in curl openssl; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    step "Installing $tool"
    as_root apt-get update -qq
    as_root apt-get install -y -qq "$tool"
  fi
done
ok "Base tools present"

# ===========================================================================
step "Docker"

if command -v docker >/dev/null 2>&1 && as_root docker compose version >/dev/null 2>&1; then
  ok "Docker Engine and the Compose plugin are already installed"
else
  info "Installing Docker Engine and the Compose plugin from Docker's own repository..."
  as_root apt-get update -qq
  as_root apt-get install -y -qq ca-certificates curl gnupg
  as_root install -m 0755 -d /etc/apt/keyrings

  distro_id="ubuntu"
  [[ "${ID:-ubuntu}" == "debian" ]] && distro_id="debian"

  curl -fsSL "https://download.docker.com/linux/${distro_id}/gpg" \
    | as_root gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
  as_root chmod a+r /etc/apt/keyrings/docker.gpg

  codename="${VERSION_CODENAME:-noble}"
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${distro_id} ${codename} stable" \
    | as_root tee /etc/apt/sources.list.d/docker.list >/dev/null

  as_root apt-get update -qq
  as_root apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  as_root systemctl enable --now docker
  ok "Docker installed"
fi

as_root docker info >/dev/null 2>&1 || die "Docker is installed but not responding. Check: systemctl status docker"

# ===========================================================================
step "Environment configuration"

read_env() {
  local value
  value="$(grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d '"' || true)"
  printf '%s' "${value:-$2}"
}

if [[ -f "$ENV_FILE" ]]; then
  # Guard against someone copying .env.example into place and deploying with
  # the documented placeholder secrets, which would be trivially forgeable.
  placeholders=()
  for key in AUTH_SECRET ENCRYPTION_KEY POSTGRES_PASSWORD; do
    case "$(read_env "$key" "")" in
      ""|*change-me*|*generate-with*) placeholders+=("$key") ;;
    esac
  done

  if [[ ${#placeholders[@]} -gt 0 ]]; then
    warn ".env still contains placeholder values for: ${placeholders[*]}"
    warn "Deploying with these would leave the site's secrets publicly known."
    die "Replace them with real secrets (openssl rand -base64 48), or delete .env and re-run to have them generated."
  fi

  ok ".env already exists — leaving it untouched"
  APP_PORT="$(read_env APP_PORT "$APP_PORT")"
  APP_BIND="$(read_env APP_BIND "$APP_BIND")"
  SUPERADMIN_EMAIL="$(read_env SUPERADMIN_EMAIL "$SUPERADMIN_EMAIL")"
  GENERATED_PASSWORD=""
else
  if [[ "$UPDATE_ONLY" -eq 1 ]]; then
    die "--update was given but .env does not exist yet. Run without --update first."
  fi

  if [[ -z "$SUPERADMIN_PASSWORD" ]]; then
    SUPERADMIN_PASSWORD="$(random_password)#1aA"
    GENERATED_PASSWORD="$SUPERADMIN_PASSWORD"
  else
    GENERATED_PASSWORD=""
  fi

  db_password="$(random_password)"
  auth_secret="$(random_secret)"
  encryption_key="$(random_secret)"

  site_url=""
  if [[ -n "$(primary_domain)" ]]; then
    if [[ "$CONFIGURE_TLS" -eq 1 ]]; then
      site_url="https://$(primary_domain)"
    else
      site_url="http://$(primary_domain)"
    fi
  else
    detected_ip="$(detect_public_ip)"
    site_url="http://${detected_ip:-localhost}"
  fi

  # Cookies must drop the Secure flag when the site is reachable over plain
  # HTTP, otherwise nobody can log in over a bare IP address.
  insecure_cookies="true"
  [[ "$site_url" == https://* ]] && insecure_cookies="false"

  info "Writing .env"
  umask 077
  cat > "$ENV_FILE" <<EOF
# Generated by deploy.sh on $(date -u '+%Y-%m-%d %H:%M:%S UTC')
# Keep this file private: it holds the database password and signing secrets.

# --- Database --------------------------------------------------------------
POSTGRES_USER=wirelesscom
POSTGRES_PASSWORD=${db_password}
POSTGRES_DB=wirelesscom
DATABASE_URL=postgresql://wirelesscom:${db_password}@db:5432/wirelesscom?schema=public

# --- App -------------------------------------------------------------------
NEXT_PUBLIC_SITE_URL=${site_url}
NODE_ENV=production
APP_PORT=${APP_PORT}
APP_BIND=${APP_BIND}

AUTH_SECRET=${auth_secret}
ENCRYPTION_KEY=${encryption_key}

# Set to false once the site is served over HTTPS.
ALLOW_INSECURE_COOKIES=${insecure_cookies}

RUN_SEED=${RUN_SEED}

# --- Initial super admin ---------------------------------------------------
SUPERADMIN_EMAIL=${SUPERADMIN_EMAIL}
SUPERADMIN_PASSWORD=${SUPERADMIN_PASSWORD}
SUPERADMIN_NAME=${SUPERADMIN_NAME}

# --- SMTP (fill in to enable outgoing email) -------------------------------
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="WirelessCom.Ca Inc. <no-reply@wirelesscom.ca>"
SMTP_TO=service@wirelesscom.ca

# --- Uploads ---------------------------------------------------------------
UPLOAD_DIR=/app/public/uploads
MAX_UPLOAD_MB=25
EOF
  umask 022
  as_root chmod 600 "$ENV_FILE" 2>/dev/null || chmod 600 "$ENV_FILE"
  ok "Secrets generated"
fi

# ===========================================================================
step "Building and starting the stack"

info "This takes a few minutes the first time (npm install + next build)."
compose build

# The `app` service waits on `migrate` completing successfully, so a failed
# schema update or seed surfaces here rather than as a crash-looping app.
if ! compose up -d --remove-orphans; then
  printf '\n'
  warn "Startup failed. Last lines from the migration job:"
  compose logs --tail 40 migrate || true
  die "Fix the problem above and re-run ./deploy.sh"
fi
ok "Containers started"

# ===========================================================================
step "Waiting for the application"

app_url="http://127.0.0.1:${APP_PORT}"
[[ "$APP_BIND" != "127.0.0.1" && "$APP_BIND" != "0.0.0.0" ]] && app_url="http://${APP_BIND}:${APP_PORT}"

healthy=0
for _ in $(seq 1 90); do
  if curl -fsS --max-time 3 "${app_url}/api/health" >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 2
done

if [[ "$healthy" -eq 1 ]]; then
  ok "Application is responding on ${app_url}"
else
  warn "The application did not respond within three minutes."
  warn "Inspect the logs with: docker compose logs -f app migrate"
fi

# ===========================================================================
if [[ "$CONFIGURE_NGINX" -eq 1 ]]; then
  step "nginx reverse proxy"

  if ! command -v nginx >/dev/null 2>&1; then
    info "Installing nginx..."
    as_root apt-get update -qq
    as_root apt-get install -y -qq nginx
  fi

  domains_line="$(printf '%s ' "${DOMAINS[@]:-}" | sed 's/ *$//')"
  proxy_host="127.0.0.1"

  tmp_conf="$(mktemp)"
  sed \
    -e "s|__DOMAINS__|${domains_line}|g" \
    -e "s|__APP_HOST__|${proxy_host}|g" \
    -e "s|__APP_PORT__|${APP_PORT}|g" \
    docker/nginx/wirelesscom.conf.template > "$tmp_conf"

  # A second `default_server` on port 80 makes nginx refuse to start, so the
  # stock Ubuntu default site is removed if it is still enabled.
  if [[ -L /etc/nginx/sites-enabled/default ]]; then
    info "Disabling the stock nginx default site"
    as_root rm -f /etc/nginx/sites-enabled/default
  fi

  as_root install -m 644 "$tmp_conf" "/etc/nginx/sites-available/${NGINX_SITE}"
  rm -f "$tmp_conf"
  as_root ln -sfn "/etc/nginx/sites-available/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"

  if as_root nginx -t >/dev/null 2>&1; then
    as_root systemctl reload nginx || as_root systemctl restart nginx
    as_root systemctl enable nginx >/dev/null 2>&1 || true
    ok "nginx is proxying port 80 to ${proxy_host}:${APP_PORT}"
  else
    warn "nginx rejected the configuration; it was written but not reloaded:"
    as_root nginx -t || true
  fi

  if command -v ufw >/dev/null 2>&1 && as_root ufw status 2>/dev/null | grep -q '^Status: active'; then
    as_root ufw allow 'Nginx Full' >/dev/null 2>&1 || true
    ok "Firewall rules for HTTP/HTTPS allowed"
  fi

  # --- TLS ---------------------------------------------------------------
  if [[ "$CONFIGURE_TLS" -eq 1 ]]; then
    step "TLS certificate"

    if [[ ${#DOMAINS[@]} -eq 0 ]]; then
      warn "--tls needs at least one --domain. Skipping certificate request."
    else
      command -v certbot >/dev/null 2>&1 || {
        info "Installing certbot..."
        as_root apt-get install -y -qq certbot python3-certbot-nginx
      }

      certbot_args=(--nginx --non-interactive --agree-tos --redirect)
      for domain in "${DOMAINS[@]}"; do certbot_args+=(-d "$domain"); done
      if [[ -n "$TLS_EMAIL" ]]; then
        certbot_args+=(-m "$TLS_EMAIL")
      else
        certbot_args+=(--register-unsafely-without-email)
      fi

      if as_root certbot "${certbot_args[@]}"; then
        ok "Certificate installed; HTTP now redirects to HTTPS"
        # Secure cookies are safe again now that TLS terminates at nginx.
        if grep -q '^ALLOW_INSECURE_COOKIES=true' "$ENV_FILE"; then
          as_root sed -i 's|^ALLOW_INSECURE_COOKIES=true|ALLOW_INSECURE_COOKIES=false|' "$ENV_FILE"
          as_root sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://$(primary_domain)|" "$ENV_FILE"
          info "Restarting the app so it issues Secure cookies..."
          compose up -d app
        fi
      else
        warn "certbot failed. The site still works over HTTP; re-run:"
        warn "  sudo certbot --nginx -d $(primary_domain)"
      fi
    fi
  fi
else
  step "nginx"
  info "Skipped (--no-nginx). Point your existing proxy at ${proxy_host:-127.0.0.1}:${APP_PORT}."
fi

# ===========================================================================
step "Done"

public_ip="$(detect_public_ip)"
site_display="$(primary_domain)"
[[ -z "$site_display" ]] && site_display="${public_ip:-your-server-ip}"

cat <<EOF

    ${C_BOLD}WirelessCom.Ca Inc. is deployed.${C_RESET}

    Public site   http://${site_display}/
    Admin panel   http://${site_display}/admin
    Sign in       http://${site_display}/login

    Super admin   ${SUPERADMIN_EMAIL}
EOF

if [[ -n "${GENERATED_PASSWORD:-}" ]]; then
  cat <<EOF
    Password      ${GENERATED_PASSWORD}

    ${C_YELLOW}This password is shown once. Save it now, then change it under
    Admin → My account and turn on two-factor authentication.${C_RESET}
EOF
else
  info "Password      (as configured in .env)"
fi

cat <<'EOF'

    Next steps
      1. Add your SMTP details to .env, then: docker compose up -d app
      2. Admin → Settings to confirm phone, address and social links
      3. Admin → Live streams to paste your real camera URLs
      4. Admin → Users to add staff accounts and more super admins

    Useful commands
      docker compose logs -f app      follow application logs
      docker compose ps              container status
      docker compose restart app     restart the app
      ./deploy.sh --update           rebuild after pulling new code
      ./backup.sh                    dump the database and uploaded media

EOF
