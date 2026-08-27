import {
  Activity,
  Antenna,
  Award,
  Bug,
  Building2,
  Cable,
  Calculator,
  Camera,
  Car,
  Cctv,
  Check,
  Cloud,
  Database,
  DoorClosed,
  Eye,
  FileSearch,
  Fingerprint,
  Gauge,
  Globe,
  HardDrive,
  Headset,
  Key,
  Layers,
  Lock,
  LifeBuoy,
  Mail,
  Map,
  Megaphone,
  MonitorSmartphone,
  Monitor,
  Network,
  Phone,
  Radio,
  RefreshCw,
  Router,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Siren,
  Split,
  Terminal,
  TriangleAlert,
  UserCheck,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Maps the constrained icon names allowed in block content to concrete
 * components, so editors pick from a safe list rather than typing imports.
 */
const ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  network: Network,
  phone: Phone,
  camera: Camera,
  lock: Lock,
  server: Server,
  wifi: Wifi,
  radio: Radio,
  cable: Cable,
  car: Car,
  map: Map,
  cloud: Cloud,
  monitor: Monitor,
  zap: Zap,
  check: Check,
  headset: Headset,
  eye: Eye,
  key: Key,
  database: Database,
  activity: Activity,
  globe: Globe,
  megaphone: Megaphone,
  "hard-drive": HardDrive,
  alert: TriangleAlert,
  // Extra aliases available to seeded content.
  cctv: Cctv,
  antenna: Antenna,
  award: Award,
  building: Building2,
  layers: Layers,
  // Networking, security and tooling vocabulary.
  router: Router,
  "shield-check": ShieldCheck,
  fingerprint: Fingerprint,
  "user-check": UserCheck,
  mail: Mail,
  bug: Bug,
  siren: Siren,
  segment: Split,
  backup: RefreshCw,
  assessment: FileSearch,
  door: DoorClosed,
  gauge: Gauge,
  calculator: Calculator,
  terminal: Terminal,
  search: Search,
  wrench: Wrench,
  support: LifeBuoy,
  endpoint: MonitorSmartphone,
};

export const ICON_NAMES = Object.keys(ICONS);

export function BlockIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Component = ICONS[name] ?? Check;
  return <Component className={cn("size-5", className)} aria-hidden="true" />;
}

export function getIconComponent(name: string): LucideIcon {
  return ICONS[name] ?? Check;
}
