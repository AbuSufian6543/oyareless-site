/**
 * Public header/footer menus must keep an admin's order, honour hidden
 * links, and still fill in shipped items that were never added.
 */
import {
  defaultNavNodes,
  filterVisibleNav,
  mergeNavWithDefaults,
  type DefaultNavNode,
} from "../src/lib/nav-defaults";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function withVisibility(
  node: DefaultNavNode,
  isVisible: boolean,
  children?: DefaultNavNode[],
): DefaultNavNode & { isVisible: boolean } {
  return {
    ...node,
    isVisible,
    children: (children ?? node.children).map((child) => ({
      ...child,
      isVisible: (child as { isVisible?: boolean }).isVisible ?? true,
      children: child.children,
    })),
  };
}

const defaults = defaultNavNodes("HEADER");
const home = defaults.find((item) => item.label === "Home");
const services = defaults.find((item) => item.label === "Services");
const tools = defaults.find((item) => item.label === "Tools");
const support = defaults.find((item) => item.label === "Support");
const company = defaults.find((item) => item.label === "Company");

assert("shipped header has the four dropdowns", Boolean(home && services && tools && support && company));

if (services && company && home && tools && support) {
  const firewalls = services.children.find((child) => child.label === "Firewalls");
  const itServices = services.children.find((child) => child.label === "IT Services");
  const cybersecurity = services.children.find((child) => child.label === "Cybersecurity");
  const trailer = services.children.find(
    (child) => child.href === "/mobile-security-trailer",
  );

  const loaded = [
    withVisibility(company, true),
    withVisibility(services, true, [
      { ...firewalls!, children: [], isVisible: true } as DefaultNavNode,
      { ...itServices!, children: [], isVisible: true } as DefaultNavNode,
      { ...cybersecurity!, children: [], isVisible: false } as DefaultNavNode,
      ...services.children
        .filter(
          (child) =>
            child.label !== "Firewalls" &&
            child.label !== "IT Services" &&
            child.label !== "Cybersecurity",
        )
        .map((child) => ({ ...child, isVisible: true })),
    ]),
  ];

  const merged = mergeNavWithDefaults(loaded, defaults);
  const visible = filterVisibleNav(merged);
  const visibleServices = visible.find((item) => item.label === "Services");
  const mergedServices = merged.find((item) => item.label === "Services");

  assert("admin group order is kept (Company before Services)", merged[0]?.label === "Company");
  assert(
    "missing shipped groups are added after the admin's groups",
    merged.map((item) => item.label).slice(2).includes("Tools") &&
      merged.some((item) => item.label === "Home") &&
      merged.some((item) => item.label === "Support"),
  );
  assert(
    "dropdown order follows the admin list",
    visibleServices?.children[0]?.label === "Firewalls" &&
      visibleServices?.children[1]?.label === "IT Services",
  );
  assert(
    "a hidden dropdown link stays out of the public menu",
    !visibleServices?.children.some((child) => child.label === "Cybersecurity"),
  );
  assert(
    "hiding a shipped link does not make the fallback put it back",
    Boolean(
      mergedServices?.children.some(
        (child) =>
          child.label === "Cybersecurity" &&
          (child as { isVisible?: boolean }).isVisible === false,
      ),
    ),
  );
  assert(
    "other shipped service links are still filled in",
    Boolean(trailer) &&
      Boolean(visibleServices?.children.some((child) => child.href === "/mobile-security-trailer")),
  );
}

process.exit(failed === 0 ? 0 : 1);
