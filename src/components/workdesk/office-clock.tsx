"use client";

import { useEffect, useState } from "react";

export function OfficeClock() {
  const [label, setLabel] = useState("Eastern Time");

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date());
    setLabel(format());
    const timer = window.setInterval(() => setLabel(format()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time dateTime={label} className="tabular-nums">
      {label} ET
    </time>
  );
}
