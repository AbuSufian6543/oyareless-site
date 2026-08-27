import * as Icons from "lucide-react";

/**
 * Resolves a lucide export name from the collection registry.
 *
 * A server component so the admin's icon lookup never ships the whole lucide
 * bundle to the browser.
 */
export function AdminIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Component =
    (Icons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
    >)[name] ?? Icons.Square;

  return <Component className={className} aria-hidden />;
}
