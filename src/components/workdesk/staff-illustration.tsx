import type { DashboardPersona } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export function StaffIllustration({
  persona,
  className,
  crop = "scene",
}: {
  persona: DashboardPersona | null;
  className?: string;
  crop?: "scene" | "avatar";
}) {
  return (
    <SeatedWorker
      variant={persona === "GIRL" ? "girl" : persona === "BOY" ? "boy" : "neutral"}
      className={className}
      crop={crop}
    />
  );
}

function SeatedWorker({
  variant,
  className,
  crop = "scene",
}: {
  variant: "boy" | "girl" | "neutral";
  className?: string;
  crop?: "scene" | "avatar";
}) {
  const girl = variant === "girl";
  const boy = variant === "boy";
  const skin = girl ? "#F0C3A4" : boy ? "#D9A57A" : "#E7C4A4";
  const hair = girl ? "#3A2418" : "#1C1410";
  const shirt = girl ? "#F07167" : "#1A7AD4";
  const label =
    girl
      ? "Cartoon of a woman working at a laptop"
      : boy
        ? "Cartoon of a man working at a laptop"
        : "Cartoon of a laptop on a desk";

  return (
    <svg
      viewBox={crop === "avatar" ? "132 70 80 96" : "0 0 360 260"}
      role="img"
      aria-label={label}
      className={cn("h-auto w-full", className)}
    >
      <ellipse cx="250" cy="58" rx="54" ry="54" fill={girl ? "#CFF6FB" : "#D6E9FF"} />
      <ellipse cx="52" cy="188" rx="40" ry="40" fill="#EEF4FB" />
      <ellipse cx="210" cy="214" rx="92" ry="16" fill="#071E39" opacity="0.12" />

      <g transform="translate(196 22)">
        <circle cx="32" cy="32" r="28" fill="#FFFFFF" />
        <circle cx="32" cy="32" r="23" fill="#0A2A4E" />
        <circle cx="32" cy="32" r="18" fill="#FFFFFF" />
        <circle cx="32" cy="16" r="2.4" fill="#0A5FAE" />
        <circle cx="46" cy="24" r="2.4" fill="#0A5FAE" />
        <circle cx="48" cy="40" r="2.4" fill="#22B8D8" />
        <path d="M32 32 V17" stroke="#0A5FAE" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M32 32 H44" stroke="#22B8D8" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {variant !== "neutral" && (
        <g>
          {girl && (
            <>
              <path
                d="M132 92c8-34 46-48 68-28 10 9 14 24 10 38"
                fill={hair}
              />
              <path d="M198 100c14 28 4 58-18 64" fill={hair} />
            </>
          )}
          {boy && (
            <path d="M138 96c6-26 52-32 62-6 6 16-6 28-30 30-24 2-36-8-32-24z" fill={hair} />
          )}
          <ellipse cx="168" cy="118" rx="30" ry="34" fill={skin} />
          {girl ? (
            <path d="M144 102c8-20 46-22 52-2 2 12-10 20-26 22-18 2-30-6-26-20z" fill={hair} />
          ) : (
            <path d="M142 104c10-16 50-16 54 2 2 10-12 16-26 16s-30-6-28-18z" fill={hair} />
          )}
          <ellipse cx="158" cy="118" rx="2.4" ry="3.2" fill="#2A1A12" />
          <ellipse cx="178" cy="118" rx="2.4" ry="3.2" fill="#2A1A12" />
          <path
            d="M162 134c7 6 14 6 21 0"
            fill="none"
            stroke="#C47A6A"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M138 154c10-8 50-8 62 4 6 20-8 42-32 46-28 4-44-18-30-50z" fill={shirt} />
          {boy && <rect x="158" y="154" width="22" height="16" rx="3" fill="#0A2A4E" />}
          <path d="M122 176c18-8 36-2 44 10" fill={skin} />
          <path d="M198 168c16 8 28 22 24 34" fill={skin} />
          <rect x="148" y="196" width="18" height="30" rx="7" fill={skin} />
          <rect x="172" y="196" width="18" height="30" rx="7" fill={skin} />
        </g>
      )}

      <path d="M96 214h176c8 0 10 8 3 11H104c-10 0-12-11-8-11z" fill="#0A2A4E" />
      <rect x="198" y="168" width="92" height="50" rx="9" fill="#0A2A4E" />
      <rect x="208" y="176" width="72" height="32" rx="5" fill={girl ? "#9EE7F5" : "#7FB4F6"} />
      <rect x="186" y="216" width="118" height="9" rx="3" fill="#17457C" />
      <circle cx="244" cy="192" r="3.2" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}
