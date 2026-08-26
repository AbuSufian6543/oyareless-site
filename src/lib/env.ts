/**
 * Central place for reading environment configuration so that missing values
 * fail loudly at startup instead of at the first request.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

function bool(name: string, fallback = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1" || value === "yes";
}

function int(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get encryptionKey() {
    return process.env.ENCRYPTION_KEY?.trim() || required("AUTH_SECRET");
  },
  get siteUrl() {
    return optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(
      /\/$/,
      "",
    );
  },
  get allowInsecureCookies() {
    return bool("ALLOW_INSECURE_COOKIES", false);
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  smtp: {
    get host() {
      return optional("SMTP_HOST");
    },
    get port() {
      return int("SMTP_PORT", 587);
    },
    get secure() {
      return bool("SMTP_SECURE", false);
    },
    get user() {
      return optional("SMTP_USER");
    },
    get password() {
      return optional("SMTP_PASSWORD");
    },
    get from() {
      return optional(
        "SMTP_FROM",
        "WirelessCom.Ca Inc. <no-reply@wirelesscom.ca>",
      );
    },
    get to() {
      return optional("SMTP_TO", "service@wirelesscom.ca");
    },
    /** Forms still save to the database when SMTP is not configured yet. */
    get isConfigured() {
      return Boolean(optional("SMTP_HOST"));
    },
  },
  uploads: {
    get dir() {
      return optional("UPLOAD_DIR", "./public/uploads");
    },
    get maxBytes() {
      return int("MAX_UPLOAD_MB", 25) * 1024 * 1024;
    },
  },
  superadmin: {
    get email() {
      return optional("SUPERADMIN_EMAIL", "abu@wirelesscom.ca").toLowerCase();
    },
    get password() {
      return optional("SUPERADMIN_PASSWORD");
    },
    get name() {
      return optional("SUPERADMIN_NAME", "Super Admin");
    },
  },
};
