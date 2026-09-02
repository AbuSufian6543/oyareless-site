/**
 * Declarative admin CRUD for the catalog and operations models.
 *
 * Eleven models introduced in this phase need the same thing: a searchable
 * list, a create/edit form, validation, an audit entry and role gating. Rather
 * than eleven near-identical page pairs that drift apart, each model is
 * described here and rendered by one generic list page, one generic editor and
 * one pair of server actions.
 *
 * This module is imported by client components, so it must stay free of
 * `server-only` imports. Database access lives in `admin-collections.server.ts`.
 */

export type CollectionFieldKind =
  | "text"
  | "slug"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "image"
  | "icon"
  | "tags"
  | "datetime"
  | "reference"
  | "blocks";

export type CollectionField = {
  kind: CollectionFieldKind;
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** Enforced server-side for text and textarea fields. */
  maxLength?: number;
  rows?: number;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  /** Pre-filled on a new record. Should mirror the column default. */
  defaultValue?: string | number | boolean;
  /** For `slug`: which field to derive from when left blank. */
  derivedFrom?: string;
  /** For `reference`: which collection supplies the choices. */
  referenceCollection?: string;
  /** `side` fields render in the narrow right-hand column. */
  column?: "main" | "side";
};

export type CollectionGroup = "Catalogue" | "Knowledge" | "Operations";

export type CollectionDefinition = {
  /** URL segment under /admin/collections. */
  key: string;
  /** Prisma delegate name, e.g. "service". */
  model: string;
  label: string;
  plural: string;
  description: string;
  /** Lucide export name, resolved in the admin sidebar and headings. */
  icon: string;
  group: CollectionGroup;
  /** Field used for list rows, audit summaries and the browser title. */
  titleField: string;
  fields: CollectionField[];
  listColumns: Array<{ field: string; label: string }>;
  orderBy: Array<Record<string, "asc" | "desc">>;
  /** Case-insensitive contains search across these string fields. */
  searchFields: string[];
  writeRole: "EDITOR" | "ADMIN";
  /** Prefix for the "View" link, e.g. "/services". */
  publicPath?: string;
  /** Longer explanation shown above the form. */
  guidance?: string;
};

const STATUS_OPTIONS = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

/** Reused by every model that carries its own page metadata. */
const SEO_FIELDS: CollectionField[] = [
  {
    kind: "text",
    name: "metaTitle",
    label: "Meta title",
    hint: "defaults to the title",
    maxLength: 120,
    column: "side",
  },
  {
    kind: "textarea",
    name: "metaDescription",
    label: "Meta description",
    rows: 3,
    maxLength: 320,
    column: "side",
  },
];

const ORDER_FIELD: CollectionField = {
  kind: "number",
  name: "order",
  label: "Sort order",
  hint: "lower appears first",
  min: 0,
  max: 9999,
  defaultValue: 0,
  column: "side",
};

function statusField(defaultValue: string): CollectionField {
  return {
    kind: "select",
    name: "status",
    label: "Status",
    options: STATUS_OPTIONS,
    defaultValue,
    column: "side",
  };
}

function featuredField(label: string): CollectionField {
  return {
    kind: "boolean",
    name: "featured",
    label,
    defaultValue: false,
    column: "side",
  };
}

export const COLLECTIONS: CollectionDefinition[] = [
  {
    key: "service-categories",
    model: "serviceCategory",
    label: "Service category",
    plural: "Service categories",
    description: "Groups the service catalog on the public pages.",
    icon: "FolderTree",
    group: "Catalogue",
    titleField: "name",
    writeRole: "EDITOR",
    searchFields: ["name", "slug"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    listColumns: [
      { field: "name", label: "Name" },
      { field: "slug", label: "Slug" },
      { field: "order", label: "Order" },
    ],
    fields: [
      { kind: "text", name: "name", label: "Name", required: true, maxLength: 120 },
      { kind: "slug", name: "slug", label: "Slug", derivedFrom: "name", required: true },
      { kind: "textarea", name: "description", label: "Description", rows: 3, maxLength: 500 },
      { kind: "icon", name: "icon", label: "Icon", column: "side" },
      ORDER_FIELD,
    ],
  },
  {
    key: "services",
    model: "service",
    label: "Service",
    plural: "Services",
    description:
      "Internal catalog cards only. Photos and promo videos that visitors see are edited on Admin → Pages for each live service URL (for example /it-services).",
    icon: "Wrench",
    group: "Catalogue",
    titleField: "name",
    writeRole: "EDITOR",
    searchFields: ["name", "slug", "summary"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    publicPath: "/services",
    listColumns: [
      { field: "name", label: "Name" },
      { field: "status", label: "Status" },
      { field: "order", label: "Order" },
    ],
    fields: [
      { kind: "text", name: "name", label: "Name", required: true, maxLength: 160 },
      { kind: "slug", name: "slug", label: "Slug", derivedFrom: "name", required: true },
      {
        kind: "textarea",
        name: "summary",
        label: "Summary",
        hint: "one or two sentences, used on cards",
        rows: 3,
        maxLength: 500,
      },
      { kind: "blocks", name: "blocks", label: "Page sections" },
      statusField("DRAFT"),
      {
        kind: "reference",
        name: "categoryId",
        label: "Category",
        referenceCollection: "service-categories",
        column: "side",
      },
      { kind: "icon", name: "icon", label: "Icon", column: "side" },
      {
        kind: "image",
        name: "imageUrl",
        label: "Card image",
        hint: "Catalog thumbnail only. The public slideshow is on Admin → Pages.",
        column: "side",
      },
      {
        kind: "text",
        name: "imageAlt",
        label: "Image alt text",
        hint: "describe the photo",
        maxLength: 300,
        column: "side",
      },
      featuredField("Feature this service"),
      ORDER_FIELD,
      ...SEO_FIELDS,
    ],
  },
  {
    key: "brands",
    model: "brand",
    label: "Brand",
    plural: "Brands",
    description:
      "Vendors whose equipment the business installs and supports, shown on /brands and in brand grids.",
    icon: "Boxes",
    group: "Catalogue",
    titleField: "name",
    writeRole: "EDITOR",
    searchFields: ["name", "slug", "category"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    publicPath: "/brands",
    guidance:
      "Only fill in Relationship where a formal arrangement genuinely exists, such as an authorized dealership. Everything else should read as a technology the business supports.",
    listColumns: [
      { field: "name", label: "Name" },
      { field: "category", label: "Category" },
      { field: "relationship", label: "Relationship" },
      { field: "status", label: "Status" },
    ],
    fields: [
      { kind: "text", name: "name", label: "Name", required: true, maxLength: 120 },
      { kind: "slug", name: "slug", label: "Slug", derivedFrom: "name", required: true },
      {
        kind: "text",
        name: "category",
        label: "Category",
        placeholder: "Two-way radio",
        maxLength: 120,
      },
      { kind: "textarea", name: "description", label: "Description", rows: 4, maxLength: 1200 },
      {
        kind: "text",
        name: "relationship",
        label: "Formal relationship",
        hint: "leave blank unless one exists",
        placeholder: "Authorized Dealer",
        maxLength: 120,
        column: "side",
      },
      { kind: "image", name: "logoUrl", label: "Logo", column: "side" },
      {
        kind: "text",
        name: "websiteUrl",
        label: "Website",
        placeholder: "https://",
        maxLength: 300,
        column: "side",
      },
      statusField("PUBLISHED"),
      featuredField("Feature this brand"),
      ORDER_FIELD,
    ],
  },
  {
    key: "faq",
    model: "faqItem",
    label: "FAQ entry",
    plural: "FAQ",
    description: "Questions and answers for /faq and any FAQ section on a page.",
    icon: "CircleHelp",
    group: "Knowledge",
    titleField: "question",
    writeRole: "EDITOR",
    searchFields: ["question", "answer", "category"],
    orderBy: [{ category: "asc" }, { order: "asc" }],
    publicPath: "/faq",
    listColumns: [
      { field: "question", label: "Question" },
      { field: "category", label: "Category" },
      { field: "status", label: "Status" },
    ],
    fields: [
      { kind: "text", name: "question", label: "Question", required: true, maxLength: 300 },
      {
        kind: "textarea",
        name: "answer",
        label: "Answer",
        required: true,
        rows: 6,
        maxLength: 4000,
      },
      {
        kind: "text",
        name: "category",
        label: "Category",
        placeholder: "General",
        maxLength: 80,
        defaultValue: "General",
        column: "side",
      },
      statusField("PUBLISHED"),
      ORDER_FIELD,
    ],
  },
  {
    key: "kb-categories",
    model: "kbCategory",
    label: "Knowledge base category",
    plural: "KB categories",
    description: "Sections of the knowledge base.",
    icon: "FolderTree",
    group: "Knowledge",
    titleField: "name",
    writeRole: "EDITOR",
    searchFields: ["name", "slug"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    listColumns: [
      { field: "name", label: "Name" },
      { field: "slug", label: "Slug" },
      { field: "order", label: "Order" },
    ],
    fields: [
      { kind: "text", name: "name", label: "Name", required: true, maxLength: 120 },
      { kind: "slug", name: "slug", label: "Slug", derivedFrom: "name", required: true },
      { kind: "textarea", name: "description", label: "Description", rows: 3, maxLength: 500 },
      { kind: "icon", name: "icon", label: "Icon", column: "side" },
      ORDER_FIELD,
    ],
  },
  {
    key: "kb-articles",
    model: "kbArticle",
    label: "Knowledge base article",
    plural: "KB articles",
    description: "How-to guides and explainers, written with the section editor.",
    icon: "BookOpen",
    group: "Knowledge",
    titleField: "title",
    writeRole: "EDITOR",
    searchFields: ["title", "slug", "summary"],
    orderBy: [{ order: "asc" }, { title: "asc" }],
    publicPath: "/knowledge-base",
    listColumns: [
      { field: "title", label: "Title" },
      { field: "status", label: "Status" },
      { field: "views", label: "Views" },
    ],
    fields: [
      { kind: "text", name: "title", label: "Title", required: true, maxLength: 200 },
      { kind: "slug", name: "slug", label: "Slug", derivedFrom: "title", required: true },
      { kind: "textarea", name: "summary", label: "Summary", rows: 3, maxLength: 500 },
      { kind: "blocks", name: "blocks", label: "Article body" },
      statusField("DRAFT"),
      {
        kind: "reference",
        name: "categoryId",
        label: "Category",
        referenceCollection: "kb-categories",
        column: "side",
      },
      featuredField("Feature this article"),
      ORDER_FIELD,
      ...SEO_FIELDS,
    ],
  },
  {
    key: "case-studies",
    model: "caseStudy",
    label: "Case study",
    plural: "Case studies",
    description: "Real projects described as problem, solution, implementation and result.",
    icon: "FileText",
    group: "Knowledge",
    titleField: "title",
    writeRole: "EDITOR",
    searchFields: ["title", "slug", "sector", "clientName"],
    orderBy: [{ order: "asc" }, { title: "asc" }],
    publicPath: "/case-studies",
    guidance:
      "Only publish work that actually happened, and only name a client where you have their permission. Leave the client blank and describe the sector instead if you do not.",
    listColumns: [
      { field: "title", label: "Title" },
      { field: "sector", label: "Sector" },
      { field: "status", label: "Status" },
    ],
    fields: [
      { kind: "text", name: "title", label: "Title", required: true, maxLength: 200 },
      { kind: "slug", name: "slug", label: "Slug", derivedFrom: "title", required: true },
      {
        kind: "text",
        name: "sector",
        label: "Sector",
        placeholder: "Manufacturing",
        maxLength: 120,
      },
      {
        kind: "text",
        name: "clientName",
        label: "Client name",
        hint: "only with permission",
        maxLength: 160,
      },
      { kind: "textarea", name: "problem", label: "Problem", rows: 4, maxLength: 2000 },
      { kind: "textarea", name: "solution", label: "Solution", rows: 4, maxLength: 2000 },
      {
        kind: "textarea",
        name: "implementation",
        label: "Implementation",
        rows: 4,
        maxLength: 2000,
      },
      { kind: "textarea", name: "result", label: "Result", rows: 4, maxLength: 2000 },
      { kind: "blocks", name: "blocks", label: "Additional sections" },
      statusField("DRAFT"),
      { kind: "image", name: "imageUrl", label: "Header image", column: "side" },
      {
        kind: "text",
        name: "imageAlt",
        label: "Image alt text",
        maxLength: 300,
        column: "side",
      },
      featuredField("Feature this case study"),
      ORDER_FIELD,
      ...SEO_FIELDS,
    ],
  },
  {
    key: "embeds",
    model: "embedSnippet",
    label: "Embed snippet",
    plural: "Embeds",
    description:
      "Named third-party markup — dashboards, maps, camera feeds — that pages can reference instead of pasting HTML repeatedly.",
    icon: "Code",
    group: "Operations",
    titleField: "name",
    writeRole: "ADMIN",
    searchFields: ["name", "slug"],
    orderBy: [{ name: "asc" }],
    guidance:
      "This markup is sanitised before it renders, and only iframes from hosts on the allow list will load. Scripts are stripped: use Branding & theme for site-wide script tags.",
    listColumns: [
      { field: "name", label: "Name" },
      { field: "slug", label: "Reference" },
      { field: "placement", label: "Placement" },
      { field: "isActive", label: "Active" },
    ],
    fields: [
      { kind: "text", name: "name", label: "Name", required: true, maxLength: 120 },
      {
        kind: "slug",
        name: "slug",
        label: "Reference",
        hint: "used by the Embed section",
        derivedFrom: "name",
        required: true,
      },
      { kind: "textarea", name: "description", label: "What this is", rows: 2, maxLength: 500 },
      {
        kind: "textarea",
        name: "html",
        label: "Markup",
        required: true,
        rows: 10,
        maxLength: 20000,
      },
      {
        kind: "select",
        name: "placement",
        label: "Placement",
        options: [
          { value: "PAGE", label: "Inside a page" },
          { value: "HEAD", label: "Document head" },
          { value: "BODY_END", label: "End of body" },
        ],
        defaultValue: "PAGE",
        column: "side",
      },
      {
        kind: "tags",
        name: "allowedPages",
        label: "Limit to page slugs",
        hint: "blank means anywhere",
        column: "side",
      },
      {
        kind: "boolean",
        name: "isActive",
        label: "Active",
        defaultValue: true,
        column: "side",
      },
    ],
  },
  {
    key: "monitors",
    model: "monitoredEndpoint",
    label: "Monitored endpoint",
    plural: "Monitoring",
    description:
      "Endpoints this application probes itself. Everything on the public status pages comes from these checks.",
    icon: "Activity",
    group: "Operations",
    titleField: "name",
    writeRole: "ADMIN",
    searchFields: ["name", "target"],
    orderBy: [{ order: "asc" }, { name: "asc" }],
    publicPath: "/network-status",
    guidance:
      "Probes run from the server, so only target hosts you are authorized to check. Public endpoints appear on /network-status; leave that off for internal-only monitoring.",
    listColumns: [
      { field: "name", label: "Name" },
      { field: "kind", label: "Type" },
      { field: "target", label: "Target" },
      { field: "enabled", label: "Enabled" },
    ],
    fields: [
      { kind: "text", name: "name", label: "Display name", required: true, maxLength: 120 },
      {
        kind: "text",
        name: "target",
        label: "Target",
        hint: "full URL for HTTP, hostname for TCP or DNS",
        required: true,
        maxLength: 500,
        placeholder: "https://example.ca/health",
      },
      {
        kind: "select",
        name: "kind",
        label: "Probe type",
        options: [
          { value: "HTTP", label: "HTTP request" },
          { value: "TCP", label: "TCP connect" },
          { value: "DNS", label: "DNS resolve" },
        ],
        defaultValue: "HTTP",
        column: "side",
      },
      {
        kind: "number",
        name: "port",
        label: "Port",
        hint: "TCP only",
        min: 1,
        max: 65535,
        column: "side",
      },
      {
        kind: "number",
        name: "expectStatus",
        label: "Expected HTTP status",
        min: 100,
        max: 599,
        defaultValue: 200,
        column: "side",
      },
      {
        kind: "number",
        name: "timeoutMs",
        label: "Timeout (ms)",
        min: 500,
        max: 30000,
        defaultValue: 5000,
        column: "side",
      },
      {
        kind: "number",
        name: "intervalSec",
        label: "Check every (seconds)",
        min: 60,
        max: 86400,
        defaultValue: 300,
        column: "side",
      },
      {
        kind: "boolean",
        name: "enabled",
        label: "Run this probe",
        defaultValue: true,
        column: "side",
      },
      {
        kind: "boolean",
        name: "isPublic",
        label: "Show on the public status page",
        defaultValue: true,
        column: "side",
      },
      ORDER_FIELD,
    ],
  },
  {
    key: "incidents",
    model: "incident",
    label: "Incident",
    plural: "Incidents",
    description: "Service-affecting events, shown on the status page while unresolved.",
    icon: "TriangleAlert",
    group: "Operations",
    titleField: "title",
    writeRole: "ADMIN",
    searchFields: ["title", "affected"],
    orderBy: [{ startedAt: "desc" }],
    publicPath: "/network-status",
    listColumns: [
      { field: "title", label: "Title" },
      { field: "severity", label: "Severity" },
      { field: "startedAt", label: "Started" },
      { field: "resolvedAt", label: "Resolved" },
    ],
    fields: [
      { kind: "text", name: "title", label: "Title", required: true, maxLength: 200 },
      {
        kind: "text",
        name: "affected",
        label: "Affected services",
        hint: "free text, shown to visitors",
        maxLength: 300,
      },
      {
        kind: "select",
        name: "severity",
        label: "Severity",
        options: [
          { value: "MINOR", label: "Minor" },
          { value: "MAJOR", label: "Major" },
          { value: "CRITICAL", label: "Critical" },
          { value: "MAINTENANCE", label: "Maintenance" },
        ],
        defaultValue: "MINOR",
        column: "side",
      },
      { kind: "datetime", name: "startedAt", label: "Started at", column: "side" },
      {
        kind: "datetime",
        name: "resolvedAt",
        label: "Resolved at",
        hint: "blank while ongoing",
        column: "side",
      },
      {
        kind: "boolean",
        name: "isPublic",
        label: "Show publicly",
        defaultValue: true,
        column: "side",
      },
    ],
  },
  {
    key: "incident-updates",
    model: "incidentUpdate",
    label: "Incident update",
    plural: "Incident updates",
    description: "Timeline entries posted against an incident.",
    icon: "MessageSquare",
    group: "Operations",
    titleField: "body",
    writeRole: "ADMIN",
    searchFields: ["body"],
    orderBy: [{ createdAt: "desc" }],
    listColumns: [
      { field: "body", label: "Update" },
      { field: "createdAt", label: "Posted" },
    ],
    fields: [
      {
        kind: "reference",
        name: "incidentId",
        label: "Incident",
        referenceCollection: "incidents",
        required: true,
      },
      { kind: "textarea", name: "body", label: "Update", required: true, rows: 5, maxLength: 4000 },
    ],
  },
  {
    key: "maintenance",
    model: "maintenanceWindow",
    label: "Maintenance window",
    plural: "Maintenance",
    description: "Planned work, announced ahead of time on the status page.",
    icon: "CalendarClock",
    group: "Operations",
    titleField: "title",
    writeRole: "ADMIN",
    searchFields: ["title", "affected"],
    orderBy: [{ startsAt: "desc" }],
    publicPath: "/network-status",
    listColumns: [
      { field: "title", label: "Title" },
      { field: "startsAt", label: "Starts" },
      { field: "endsAt", label: "Ends" },
      { field: "isPublic", label: "Public" },
    ],
    fields: [
      { kind: "text", name: "title", label: "Title", required: true, maxLength: 200 },
      { kind: "textarea", name: "description", label: "Description", rows: 4, maxLength: 2000 },
      {
        kind: "text",
        name: "affected",
        label: "Affected services",
        maxLength: 300,
      },
      { kind: "datetime", name: "startsAt", label: "Starts at", required: true, column: "side" },
      { kind: "datetime", name: "endsAt", label: "Ends at", required: true, column: "side" },
      {
        kind: "boolean",
        name: "isPublic",
        label: "Show publicly",
        defaultValue: true,
        column: "side",
      },
    ],
  },
  {
    key: "customers",
    model: "customer",
    label: "Customer",
    plural: "Customers",
    description:
      "Portal accounts belong to a customer. Creating one here lets you invite its users from the Portal users screen.",
    icon: "Building2",
    group: "Operations",
    titleField: "name",
    writeRole: "ADMIN",
    searchFields: ["name", "accountRef", "email", "city"],
    orderBy: [{ name: "asc" }],
    listColumns: [
      { field: "name", label: "Name" },
      { field: "accountRef", label: "Account ref" },
      { field: "city", label: "City" },
      { field: "isActive", label: "Active" },
    ],
    fields: [
      { kind: "text", name: "name", label: "Company name", required: true, maxLength: 200 },
      {
        kind: "text",
        name: "accountRef",
        label: "Account reference",
        hint: "must be unique if set",
        maxLength: 60,
      },
      { kind: "text", name: "email", label: "Email", maxLength: 200 },
      { kind: "text", name: "phone", label: "Phone", maxLength: 60 },
      { kind: "text", name: "addressLine1", label: "Address line 1", maxLength: 200 },
      { kind: "text", name: "addressLine2", label: "Address line 2", maxLength: 200 },
      { kind: "textarea", name: "notes", label: "Internal notes", rows: 4, maxLength: 4000 },
      { kind: "text", name: "city", label: "City", maxLength: 120, column: "side" },
      { kind: "text", name: "province", label: "Province", maxLength: 60, column: "side" },
      { kind: "text", name: "postalCode", label: "Postal code", maxLength: 20, column: "side" },
      {
        kind: "boolean",
        name: "isActive",
        label: "Active",
        defaultValue: true,
        column: "side",
      },
    ],
  },
];

const byKey = new Map(COLLECTIONS.map((collection) => [collection.key, collection]));

export function getCollection(key: string): CollectionDefinition | undefined {
  return byKey.get(key);
}

export function collectionsInGroup(group: CollectionGroup): CollectionDefinition[] {
  return COLLECTIONS.filter((collection) => collection.group === group);
}

/** True when the model carries a `blocks` column edited by the section editor. */
export function hasBlocks(collection: CollectionDefinition): boolean {
  return collection.fields.some((field) => field.kind === "blocks");
}
