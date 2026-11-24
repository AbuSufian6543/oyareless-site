import "server-only";

import { unstable_cache } from "next/cache";

const LATITUDE = 46.52;
const LONGITUDE = -84.33;
const ZONE = "America/Toronto";

export type WeatherDay = {
  date: string;
  label: string;
  code: number;
  high: number;
  low: number;
  precip: number | null;
};

export type WeatherAlert = {
  id: string;
  name: string;
  place: string;
  level: string;
};

export type SaultWeather =
  | {
      ok: true;
      updatedAt: string;
      observedAt: string;
      temperature: number;
      feelsLike: number;
      humidity: number;
      windKmh: number;
      windFrom: string;
      condition: string;
      code: number;
      precipChance: number | null;
      high: number;
      low: number;
      sunrise: string;
      sunset: string;
      days: WeatherDay[];
      alerts: WeatherAlert[];
      alertsReady: boolean;
    }
  | { ok: false; updatedAt: string };

const CONDITIONS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function conditionLabel(code: number): string {
  return CONDITIONS[code] ?? "Conditions unavailable";
}

function windFrom(degrees: number): string {
  const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return names[Math.round(degrees / 45) % 8] ?? "N";
}

function clockLabel(value: string): string {
  const time = value.split("T")[1] ?? "";
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  if (!minute || Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? "p.m." : "a.m.";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    weekday: "short",
  }).format(new Date(`${date}T15:00:00Z`));
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Weather request failed (${response.status})`);
  return response.json();
}

function numberAt(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function loadAlerts(): Promise<{ ready: boolean; alerts: WeatherAlert[] }> {
  try {
    const payload = (await readJson(
      "https://api.weather.gc.ca/collections/weather-alerts/items?f=json&limit=12&bbox=-84.62,46.42,-84.15,46.68",
    )) as { features?: Array<{ id?: string; properties?: Record<string, unknown> }> };
    const alerts = (payload.features ?? [])
      .map((feature) => {
        const props = feature.properties ?? {};
        const status = String(props.status_en ?? "").toLowerCase();
        if (status === "ended" || status === "cancelled") return null;
        const name = String(props.alert_name_en ?? "").trim();
        if (!name) return null;
        return {
          id: String(feature.id ?? props.feature_id ?? name),
          name,
          place: String(props.feature_name_en ?? "Sault Ste. Marie"),
          level: String(props.alert_type ?? "alert"),
        };
      })
      .filter((alert): alert is WeatherAlert => Boolean(alert))
      .slice(0, 3);
    return { ready: true, alerts };
  } catch {
    return { ready: false, alerts: [] };
  }
}

async function loadForecast(): Promise<SaultWeather> {
  const updatedAt = new Date().toISOString();
  try {
    const [forecast, alerts] = await Promise.all([
      readJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=${encodeURIComponent(ZONE)}&forecast_days=7`,
      ) as Promise<{
        current?: Record<string, unknown>;
        hourly?: { time?: string[]; precipitation_probability?: Array<number | null> };
        daily?: Record<string, unknown[]>;
      }>,
      loadAlerts(),
    ]);
    const current = forecast.current ?? {};
    const daily = forecast.daily ?? {};
    const dates = (daily.time ?? []) as string[];
    const temperature = numberAt(current.temperature_2m);
    const feelsLike = numberAt(current.apparent_temperature);
    const humidity = numberAt(current.relative_humidity_2m);
    const wind = numberAt(current.wind_speed_10m);
    const direction = numberAt(current.wind_direction_10m);
    const code = numberAt(current.weather_code);
    const high = numberAt(daily.temperature_2m_max?.[0]);
    const low = numberAt(daily.temperature_2m_min?.[0]);
    if (
      temperature === null ||
      feelsLike === null ||
      humidity === null ||
      wind === null ||
      direction === null ||
      code === null ||
      high === null ||
      low === null
    ) {
      return { ok: false, updatedAt };
    }
    const observed = String(current.time ?? "");
    const hourKey = observed.slice(0, 13);
    const hourIndex = (forecast.hourly?.time ?? []).findIndex((time) => time.slice(0, 13) === hourKey);
    const precipChance =
      hourIndex >= 0 ? numberAt(forecast.hourly?.precipitation_probability?.[hourIndex]) : null;
    const days: WeatherDay[] = dates.slice(0, 7).flatMap((date, index) => {
      const dayCode = numberAt(daily.weather_code?.[index]);
      const dayHigh = numberAt(daily.temperature_2m_max?.[index]);
      const dayLow = numberAt(daily.temperature_2m_min?.[index]);
      if (dayCode === null || dayHigh === null || dayLow === null) return [];
      return [
        {
          date,
          label: dayLabel(date),
          code: dayCode,
          high: dayHigh,
          low: dayLow,
          precip: numberAt(daily.precipitation_probability_max?.[index]),
        },
      ];
    });
    return {
      ok: true,
      updatedAt,
      observedAt: observed,
      temperature,
      feelsLike,
      humidity,
      windKmh: wind,
      windFrom: windFrom(direction),
      condition: conditionLabel(code),
      code,
      precipChance,
      high,
      low,
      sunrise: clockLabel(String(daily.sunrise?.[0] ?? "")),
      sunset: clockLabel(String(daily.sunset?.[0] ?? "")),
      days,
      alerts: alerts.alerts,
      alertsReady: alerts.ready,
    };
  } catch {
    return { ok: false, updatedAt };
  }
}

export const loadSaultWeather = unstable_cache(loadForecast, ["sault-ste-marie-weather"], {
  revalidate: 600,
});
