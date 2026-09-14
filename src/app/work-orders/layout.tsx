import type { Metadata } from "next";

import "./work-order.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work order",
  robots: { index: false, follow: false },
};

export default function WorkOrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
