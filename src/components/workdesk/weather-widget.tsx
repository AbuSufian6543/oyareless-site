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

function WeatherGlyph({ code, compact = false }: { code: number; compact?: boolean }) {
  const kind = tone(code);
  const size = compact ? "size-8" : "size-12";
  if (kind === "clear") {
    return (
      <svg viewBox="0 0 48 48" className={`wc-sun ${size} text-amber-500`} aria-hidden="true">
        <circle cx="24" cy="24" r="8" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" />
        </g>
      </svg>
    );
  }
  if (kind === "rain" || kind === "storm") {
    return (
      <svg viewBox="0 0 48 48" className={`${size} text-sky-700`} aria-hidden="true">
        <path className="wc-drift" d="M16 28h16a8 8 0 0 0 0-16 10 10 0 0 0-19-2A7 7 0 0 0 16 28z" fill="currentColor" />
        <g className="wc-precip" stroke="#0284c7" strokeWidth="2" strokeLinecap="round">
          <path d="M18 32l-2 6M24 32l-2 6M30 32l-2 6" />
        </g>
      </svg>
    );
  }
  if (kind === "snow") {
    return (
      <svg viewBox="0 0 48 48" className={`${size} text-sky-800`} aria-hidden="true">
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
    <svg viewBox="0 0 48 48" className={`${size} text-slate-500`} aria-hidden="true">
      <path className="wc-drift" d="M16 30h18a8 8 0 0 0 0-16 11 11 0 0 0-20-1A7 7 0 0 0 16 30z" fill="currentColor" />
    </svg>
  );
}

function WeatherBody({ weather }: { weather: SaultWeather }) {
  if (!weather.ok) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-navy-900">Sault Ste. Marie, Ontario</p>
        <p className="mt-2 text-sm text-slate-600">
          Weather is unavailable right now. The office forecast will try again on the next refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white">
      <div className="flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-800">Sault Ste. Marie, Ontario</p>
          <div className="mt-2 flex items-center gap-3">
            <WeatherGlyph code={weather.code} />
            <div>
              <p className="text-4xl font-bold tabular-nums tracking-tight text-navy-900">
                {Math.round(weather.temperature)}°
              </p>
              <p className="text-sm font-semibold text-navy-800">{weather.condition}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Feels like {Math.round(weather.feelsLike)}° · High {Math.round(weather.high)}° · Low {Math.round(weather.low)}°
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Humidity</dt>
            <dd className="font-semibold text-navy-900">{Math.round(weather.humidity)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Wind</dt>
            <dd className="font-semibold text-navy-900">{Math.round(weather.windKmh)} km/h {weather.windFrom}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Precipitation</dt>
            <dd className="font-semibold text-navy-900">{weather.precipChance === null ? "—" : `${Math.round(weather.precipChance)}%`}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Sun</dt>
            <dd className="font-semibold text-navy-900">{weather.sunrise} – {weather.sunset}</dd>
          </div>
        </dl>
      </div>
      {weather.alerts.length > 0 ? (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Weather alerts</p>
          <ul className="mt-1 space-y-1">
            {weather.alerts.map((alert) => (
              <li key={alert.id} className="text-sm font-semibold text-amber-950">
                {alert.name}
                <span className="ml-2 font-medium text-amber-800">{alert.place}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="border-t border-sky-100 px-4 py-2 text-xs text-slate-500">
          {weather.alertsReady
            ? "No official Environment Canada alerts for Sault Ste. Marie."
            : "Official alerts could not be loaded. The forecast above is still current."}
        </p>
      )}
      <ol className="grid grid-cols-2 gap-2 border-t border-sky-100 p-3 sm:grid-cols-4 lg:grid-cols-7">
        {weather.days.map((day) => (
          <li key={day.date} className="rounded-lg px-2 py-2 text-center transition-colors duration-150 hover:bg-white">
            <p className="text-xs font-bold text-slate-500">{day.label}</p>
            <div className="mx-auto mt-1 flex justify-center">
              <WeatherGlyph code={day.code} compact />
            </div>
            <p className="text-sm font-bold tabular-nums text-navy-900">{Math.round(day.high)}°</p>
            <p className="text-xs tabular-nums text-slate-500">{Math.round(day.low)}°</p>
            <p className="text-[11px] text-sky-800">{day.precip === null ? "" : `${Math.round(day.precip)}%`}</p>
          </li>
        ))}
      </ol>
      <p className="px-4 pb-3 text-[11px] text-slate-400">
        Updated {formatDateTime(weather.updatedAt)} · Open-Meteo forecast and Environment Canada alerts · America/Toronto
      </p>
    </div>
  );
}

export function WeatherSkeleton() {
  return <div className="h-72 animate-pulse rounded-xl bg-sky-50" aria-hidden="true" />;
}

export async function WeatherPanel() {
  const weather = await loadSaultWeather();
  return <WeatherBody weather={weather} />;
}
