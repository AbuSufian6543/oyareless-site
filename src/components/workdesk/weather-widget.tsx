import { loadSaultWeather, type SaultWeather } from "@/lib/workdesk/sault-weather";
import { formatDateTime } from "@/lib/utils";

function tone(code: number): "clear" | "cloud" | "rain" | "snow" | "storm" {
  if (code === 0 || code === 1) return "clear";
  if (code >= 95) return "storm";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 85 && code <= 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloud";
}

function WeatherGlyph({ code, size = "md" }: { code: number; size?: "sm" | "md" }) {
  const kind = tone(code);
  const box = size === "sm" ? "size-5" : "size-8";
  if (kind === "clear") {
    return (
      <svg viewBox="0 0 48 48" className={`wc-sun ${box} text-amber-500`} aria-hidden="true">
        <circle cx="24" cy="24" r="8" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" />
        </g>
      </svg>
    );
  }
  if (kind === "rain" || kind === "storm") {
    return (
      <svg viewBox="0 0 48 48" className={`${box} text-sky-700`} aria-hidden="true">
        <path className="wc-drift" d="M16 28h16a8 8 0 0 0 0-16 10 10 0 0 0-19-2A7 7 0 0 0 16 28z" fill="currentColor" />
        <g className="wc-precip" stroke="#0284c7" strokeWidth="2" strokeLinecap="round">
          <path d="M18 32l-2 6M24 32l-2 6M30 32l-2 6" />
        </g>
      </svg>
    );
  }
  if (kind === "snow") {
    return (
      <svg viewBox="0 0 48 48" className={`${box} text-sky-800`} aria-hidden="true">
        <path className="wc-drift" d="M16 26h16a8 8 0 0 0 0-16 10 10 0 0 0-19-2A7 7 0 0 0 16 26z" fill="currentColor" />
        <g className="wc-precip" fill="#e0f2fe">
          <circle cx="18" cy="34" r="1.6" />
          <circle cx="25" cy="38" r="1.6" />
          <circle cx="32" cy="33" r="1.6" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className={`${box} text-slate-500`} aria-hidden="true">
      <path className="wc-drift" d="M16 30h18a8 8 0 0 0 0-16 11 11 0 0 0-20-1A7 7 0 0 0 16 30z" fill="currentColor" />
    </svg>
  );
}

function WeatherBody({ weather }: { weather: SaultWeather }) {
  if (!weather.ok) {
    return (
      <div className="max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2">
        <p className="text-sm font-semibold text-navy-900">Sault Ste. Marie</p>
        <p className="text-xs text-slate-500">Weather is unavailable right now.</p>
      </div>
    );
  }

  const updatedFull = formatDateTime(weather.updatedAt);
  const alertNote = weather.alerts.length > 0 ? ` Alert: ${weather.alerts.map((alert) => alert.name).join(", ")}.` : "";

  return (
    <div
      className="wc-enter flex max-w-full items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 shadow-[0_1px_2px_rgba(15,42,73,0.04)] transition duration-200 hover:border-sky-200 hover:bg-sky-50"
      title={`Updated ${updatedFull}. Open-Meteo forecast, America/Toronto.${alertNote}`}
    >
      <WeatherGlyph code={weather.code} />
      <div className="min-w-0">
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums leading-none tracking-tight text-navy-900">
            {Math.round(weather.temperature)}°
          </span>
          <span className="truncate text-sm font-semibold text-navy-800">{weather.condition}</span>
        </p>
        <p className="mt-0.5 truncate text-xs font-semibold text-sky-800">Sault Ste. Marie, Ontario</p>
        <p className="truncate text-xs text-slate-600">
          Feels like {Math.round(weather.feelsLike)}° · High {Math.round(weather.high)}° · Low {Math.round(weather.low)}°
        </p>
      </div>
    </div>
  );
}

export function WeatherSkeleton() {
  return <div className="h-16 w-full max-w-xs animate-pulse rounded-xl bg-sky-50" aria-hidden="true" />;
}

export async function WeatherPanel() {
  const weather = await loadSaultWeather();
  return <WeatherBody weather={weather} />;
}
