import { loadSaultWeather, type SaultWeather } from "@/lib/workdesk/sault-weather";
import { formatDate, formatDateTime } from "@/lib/utils";

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
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-navy-900">Sault Ste. Marie, Ontario</p>
        <p className="mt-1 text-sm text-slate-600">
          Weather is unavailable right now. The office forecast will try again on the next refresh.
        </p>
      </div>
    );
  }

  const updated = formatDate(weather.updatedAt, { hour: "numeric", minute: "2-digit" });
  const updatedFull = formatDateTime(weather.updatedAt);

  return (
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50/70 shadow-[0_1px_2px_rgba(15,42,73,0.05)]">
      <div className="flex flex-col gap-2 px-3 py-2 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <WeatherGlyph code={weather.code} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-navy-900">
                {Math.round(weather.temperature)}°
              </p>
              <p className="truncate text-sm font-semibold text-navy-800">{weather.condition}</p>
            </div>
            <p className="mt-0.5 truncate text-xs font-semibold text-sky-800" title={`Updated ${updatedFull}. Open-Meteo forecast and Environment Canada alerts, America/Toronto.`}>
              Sault Ste. Marie, Ontario · Updated {updated}
            </p>
            <p className="truncate text-xs text-slate-600">
              Feels like {Math.round(weather.feelsLike)}° · High {Math.round(weather.high)}° · Low {Math.round(weather.low)}°
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4 lg:shrink-0">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Humidity</dt>
            <dd className="font-semibold tabular-nums text-navy-900">{Math.round(weather.humidity)}%</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wind</dt>
            <dd className="font-semibold text-navy-900">{Math.round(weather.windKmh)} km/h {weather.windFrom}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Precip</dt>
            <dd className="font-semibold tabular-nums text-navy-900">{weather.precipChance === null ? "—" : `${Math.round(weather.precipChance)}%`}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sun</dt>
            <dd className="font-semibold text-navy-900">{weather.sunrise}–{weather.sunset}</dd>
          </div>
        </dl>
      </div>
      {weather.alerts.length > 0 ? (
        <p className="border-t border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950">
          {weather.alerts.map((alert) => alert.name).join(" · ")}
        </p>
      ) : null}
      <ol className="flex gap-1 overflow-x-auto border-t border-sky-100 px-2 py-1.5 [scrollbar-width:thin]">
        {weather.days.map((day) => (
          <li key={day.date} className="w-16 shrink-0 rounded-lg px-1 py-1 text-center transition-colors duration-150 hover:bg-white sm:w-auto sm:min-w-0 sm:flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{day.label}</p>
            <div className="flex justify-center">
              <WeatherGlyph code={day.code} size="sm" />
            </div>
            <p className="text-xs font-bold tabular-nums leading-tight text-navy-900">
              {Math.round(day.high)}° <span className="font-medium text-slate-400">{Math.round(day.low)}°</span>
            </p>
            <p className="text-[10px] leading-tight text-sky-800">{day.precip === null ? "—" : `${Math.round(day.precip)}%`}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WeatherSkeleton() {
  return <div className="h-36 animate-pulse rounded-2xl bg-sky-50" aria-hidden="true" />;
}

export async function WeatherPanel() {
  const weather = await loadSaultWeather();
  return <WeatherBody weather={weather} />;
}
