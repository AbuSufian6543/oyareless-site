"use client";

import { usePathname } from "next/navigation";

import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { crumbs } from "@/lib/seo";

export function AutoHeroBreadcrumbs({ title }: { title: string }) {
  const pathname = usePathname();
  return (
    <PageBreadcrumbs items={crumbs({ name: title, href: pathname })} tone="onDark" />
  );
}
