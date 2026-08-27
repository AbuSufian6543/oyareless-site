import type { BlockType } from "@/lib/blocks";

/**
 * Declarative description of the editor controls for each block type. A single
 * generic renderer consumes these, so adding a block means adding a schema
 * entry plus a display component — never a bespoke form.
 */
export type FieldDef =
  | { kind: "text"; key: string; label: string; placeholder?: string; hint?: string }
  | { kind: "textarea"; key: string; label: string; placeholder?: string; rows?: number; hint?: string }
  | { kind: "richtext"; key: string; label: string; hint?: string }
  | { kind: "number"; key: string; label: string; min?: number; max?: number; hint?: string }
  | { kind: "boolean"; key: string; label: string; description?: string }
  | { kind: "select"; key: string; label: string; options: Array<{ value: string; label: string }>; hint?: string }
  | { kind: "icon"; key: string; label: string }
  | { kind: "image"; key: string; label: string; hint?: string }
  | { kind: "imageObject"; key: string; label: string }
  | { kind: "stringList"; key: string; label: string; itemLabel: string; hint?: string }
  | { kind: "links"; key: string; label: string; hint?: string }
  | { kind: "objectList"; key: string; label: string; itemLabel: string; fields: FieldDef[] }
  | { kind: "imageList"; key: string; label: string }
  | { kind: "table"; key: string; label: string; hint?: string }
  | { kind: "streamPicker"; key: string; label: string; hint?: string }
  | { kind: "streamMultiPicker"; key: string; label: string; hint?: string }
  | { kind: "embedCode"; key: string; label: string; hint?: string };

const COLUMN_OPTIONS_234 = [
  { value: "2", label: "2 columns" },
  { value: "3", label: "3 columns" },
  { value: "4", label: "4 columns" },
];

const LINK_STYLE_HINT = "Buttons appear in the order listed.";

export const BLOCK_FIELDS: Record<BlockType, FieldDef[]> = {
  hero: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label", placeholder: "WirelessCom.Ca Inc." },
    { kind: "text", key: "headline", label: "Headline" },
    { kind: "textarea", key: "subheadline", label: "Sub-headline", rows: 3 },
    {
      kind: "select",
      key: "variant",
      label: "Style",
      options: [
        { value: "dark", label: "Dark with background" },
        { value: "light", label: "Light" },
        { value: "split", label: "Split (text + image)" },
        { value: "minimal", label: "Minimal" },
      ],
    },
    {
      kind: "select",
      key: "height",
      label: "Height",
      options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "full", label: "Full screen" },
      ],
    },
    { kind: "image", key: "backgroundImageUrl", label: "Background image" },
    {
      kind: "text",
      key: "backgroundImageAlt",
      label: "Image description",
      hint: "Used when the photo sits beside the headline (split style).",
    },
    {
      kind: "text",
      key: "backgroundVideoUrl",
      label: "Background video URL",
      hint: "Optional MP4. Overrides the image.",
    },
    { kind: "number", key: "overlayOpacity", label: "Overlay darkness (%)", min: 0, max: 100 },
    { kind: "stringList", key: "highlights", label: "Highlight points", itemLabel: "Highlight" },
    { kind: "links", key: "buttons", label: "Buttons", hint: LINK_STYLE_HINT },
  ],

  heading: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "text", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 3 },
    {
      kind: "select",
      key: "level",
      label: "Heading level",
      options: [
        { value: "h2", label: "H2 (section)" },
        { value: "h3", label: "H3 (sub-section)" },
        { value: "h1", label: "H1 (page title — use once)" },
      ],
    },
  ],

  richText: [
    { kind: "richtext", key: "html", label: "Content" },
    {
      kind: "select",
      key: "columns",
      label: "Columns",
      options: [
        { value: "1", label: "Single column" },
        { value: "2", label: "Two columns" },
      ],
    },
  ],

  imageText: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "richtext", key: "html", label: "Content" },
    { kind: "stringList", key: "bullets", label: "Bullet points", itemLabel: "Bullet" },
    { kind: "imageObject", key: "image", label: "Image" },
    {
      kind: "select",
      key: "imagePosition",
      label: "Image position",
      options: [
        { value: "right", label: "Right of text" },
        { value: "left", label: "Left of text" },
      ],
    },
    { kind: "links", key: "buttons", label: "Buttons" },
  ],

  featureGrid: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "select", key: "columns", label: "Columns", options: COLUMN_OPTIONS_234 },
    {
      kind: "select",
      key: "style",
      label: "Card style",
      options: [
        { value: "card", label: "Cards" },
        { value: "bordered", label: "Left border" },
        { value: "plain", label: "Plain" },
        { value: "numbered", label: "Numbered" },
      ],
    },
    {
      kind: "objectList",
      key: "items",
      label: "Features",
      itemLabel: "Feature",
      fields: [
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description", rows: 2 },
      ],
    },
  ],

  serviceGrid: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "select", key: "columns", label: "Columns", options: COLUMN_OPTIONS_234 },
    {
      kind: "objectList",
      key: "items",
      label: "Service cards",
      itemLabel: "Card",
      fields: [
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description", rows: 2 },
        { kind: "text", key: "href", label: "Link", placeholder: "/it-services" },
        { kind: "image", key: "imageUrl", label: "Image (optional)" },
        { kind: "text", key: "imageAlt", label: "Image description" },
        { kind: "text", key: "badge", label: "Badge (optional)" },
      ],
    },
  ],

  steps: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "objectList",
      key: "items",
      label: "Steps",
      itemLabel: "Step",
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description", rows: 2 },
      ],
    },
  ],

  specTable: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "table", key: "columns", label: "Table", hint: "Edit column headers and rows below." },
  ],

  pricing: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "objectList",
      key: "plans",
      label: "Plans",
      itemLabel: "Plan",
      fields: [
        { kind: "text", key: "name", label: "Plan name" },
        { kind: "text", key: "price", label: "Price", placeholder: "$99" },
        { kind: "text", key: "period", label: "Period", placeholder: "/month" },
        { kind: "textarea", key: "description", label: "Description", rows: 2 },
        { kind: "stringList", key: "features", label: "Included features", itemLabel: "Feature" },
        { kind: "boolean", key: "highlighted", label: "Highlight this plan" },
      ],
    },
    { kind: "text", key: "footnote", label: "Footnote" },
  ],

  stats: [
    { kind: "text", key: "heading", label: "Heading" },
    {
      kind: "stringList",
      key: "chips",
      label: "Network and security labels",
      itemLabel: "Label",
      hint: "Short tags such as NGFW, VLAN or VPN. Leave empty to hide the row.",
    },
    {
      kind: "objectList",
      key: "items",
      label: "Statistics",
      itemLabel: "Statistic",
      fields: [
        { kind: "text", key: "value", label: "Value", placeholder: "2005" },
        { kind: "text", key: "suffix", label: "Suffix", placeholder: "+" },
        { kind: "text", key: "label", label: "Label" },
      ],
    },
  ],

  logoStrip: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "imageList", key: "images", label: "Logos" },
    { kind: "boolean", key: "grayscale", label: "Grayscale until hovered" },
  ],

  gallery: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "select",
      key: "layout",
      label: "Layout",
      options: [
        { value: "grid", label: "Grid" },
        { value: "carousel", label: "Carousel" },
      ],
    },
    { kind: "select", key: "columns", label: "Grid columns", options: COLUMN_OPTIONS_234 },
    { kind: "imageList", key: "images", label: "Images" },
  ],

  videoEmbed: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "text",
      key: "url",
      label: "Video URL",
      placeholder: "https://www.youtube.com/watch?v=…",
      hint: "Paste a YouTube or Vimeo link; it is converted to an embed automatically.",
    },
    {
      kind: "select",
      key: "aspectRatio",
      label: "Aspect ratio",
      options: [
        { value: "16/9", label: "16:9 (widescreen)" },
        { value: "4/3", label: "4:3" },
        { value: "21/9", label: "21:9 (ultra-wide)" },
        { value: "1/1", label: "1:1 (square)" },
      ],
    },
  ],

  liveStream: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "streamPicker",
      key: "streamSlug",
      label: "Stream",
      hint: "Streams are managed under Live Streams.",
    },
    { kind: "boolean", key: "showTitle", label: "Show the stream title below the player" },
  ],

  streamGrid: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "select",
      key: "columns",
      label: "Columns",
      options: [
        { value: "1", label: "1 column" },
        { value: "2", label: "2 columns" },
        { value: "3", label: "3 columns" },
      ],
    },
    { kind: "boolean", key: "featuredOnly", label: "Only show featured streams" },
    {
      kind: "streamMultiPicker",
      key: "slugs",
      label: "Specific streams",
      hint: "Leave all unchecked to show every published stream.",
    },
  ],

  embed: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "embedCode",
      key: "html",
      label: "Embed code",
      hint: "Paste an iframe or video tag. Scripts are stripped and only approved hosts are allowed.",
    },
    { kind: "number", key: "minHeight", label: "Minimum height (px)", min: 120, max: 2000 },
  ],

  cta: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "text", key: "phone", label: "Phone number to display" },
    {
      kind: "select",
      key: "variant",
      label: "Style",
      options: [
        { value: "banner", label: "Full-width banner" },
        { value: "boxed", label: "Boxed card" },
        { value: "split", label: "Split (text left, buttons right)" },
      ],
    },
    { kind: "links", key: "buttons", label: "Buttons" },
  ],

  contactForm: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "select",
      key: "formType",
      label: "Form type",
      options: [
        { value: "CONTACT", label: "General contact" },
        { value: "SUPPORT", label: "Technical support" },
        { value: "QUOTE", label: "Quote request" },
        { value: "CALLBACK", label: "Request a callback" },
      ],
      hint: "Controls how the inquiry is labeled in the admin inbox.",
    },
    { kind: "boolean", key: "showCompany", label: "Ask for company name" },
    { kind: "boolean", key: "showAddress", label: "Ask for service address" },
    { kind: "boolean", key: "showServiceInterest", label: "Ask which service they need" },
    { kind: "textarea", key: "successMessage", label: "Thank-you message", rows: 2 },
  ],

  faq: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "objectList",
      key: "items",
      label: "Questions",
      itemLabel: "Question",
      fields: [
        { kind: "text", key: "question", label: "Question" },
        { kind: "textarea", key: "answer", label: "Answer", rows: 3 },
      ],
    },
  ],

  testimonials: [
    { kind: "text", key: "heading", label: "Heading" },
    {
      kind: "select",
      key: "source",
      label: "Source",
      options: [
        { value: "database", label: "From the Testimonials list" },
        { value: "inline", label: "Typed in here" },
      ],
    },
    { kind: "number", key: "limit", label: "How many to show", min: 1, max: 12 },
    {
      kind: "objectList",
      key: "items",
      label: "Testimonials (inline only)",
      itemLabel: "Testimonial",
      fields: [
        { kind: "textarea", key: "quote", label: "Quote", rows: 3 },
        { kind: "text", key: "authorName", label: "Name" },
        { kind: "text", key: "authorRole", label: "Role" },
        { kind: "text", key: "company", label: "Company" },
        { kind: "number", key: "rating", label: "Rating (1–5)", min: 1, max: 5 },
      ],
    },
  ],

  contactDetails: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "boolean", key: "showMap", label: "Show map" },
    {
      kind: "text",
      key: "mapEmbedUrl",
      label: "Map embed URL",
      hint: "Leave blank to use the address from Site Settings.",
    },
    { kind: "textarea", key: "extraNote", label: "Additional note", rows: 3 },
  ],

  banner: [
    { kind: "textarea", key: "text", label: "Message", rows: 2 },
    {
      kind: "select",
      key: "tone",
      label: "Tone",
      options: [
        { value: "info", label: "Information (blue)" },
        { value: "success", label: "Success (green)" },
        { value: "warning", label: "Warning (amber)" },
        { value: "critical", label: "Critical (red)" },
      ],
    },
    { kind: "boolean", key: "icon", label: "Show icon" },
  ],

  downloads: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "objectList",
      key: "items",
      label: "Files",
      itemLabel: "File",
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "url", label: "File URL" },
        { kind: "text", key: "fileType", label: "File type", placeholder: "pdf" },
        { kind: "text", key: "fileSize", label: "File size", placeholder: "43 KB" },
      ],
    },
  ],

  speedTest: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "textarea", key: "note", label: "Note below the test", rows: 2 },
  ],

  posts: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "number", key: "limit", label: "How many articles", min: 1, max: 12 },
    {
      kind: "select",
      key: "columns",
      label: "Columns",
      options: [
        { value: "2", label: "2 columns" },
        { value: "3", label: "3 columns" },
      ],
    },
  ],

  jobs: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "textarea", key: "emptyMessage", label: "Message when there are no openings", rows: 2 },
  ],

  spacer: [
    {
      kind: "select",
      key: "size",
      label: "Size",
      options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra large" },
      ],
    },
    { kind: "boolean", key: "showDivider", label: "Show a divider line" },
  ],

  techHero: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "headline", label: "Headline" },
    { kind: "textarea", key: "subheadline", label: "Sub-headline", rows: 3 },
    {
      kind: "select",
      key: "height",
      label: "Height",
      options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ],
    },
    {
      kind: "image",
      key: "backgroundImageUrl",
      label: "Background photo",
      hint: "Optional. The animated network mesh is used on its own when empty.",
    },
    { kind: "number", key: "overlayOpacity", label: "Overlay darkness (%)", min: 0, max: 100 },
    {
      kind: "number",
      key: "networkDensity",
      label: "Network animation intensity (%)",
      min: 0,
      max: 200,
      hint: "0 turns the animation off. It is always off for visitors who ask for reduced motion.",
    },
    { kind: "stringList", key: "highlights", label: "Proof points", itemLabel: "Point" },
    { kind: "links", key: "buttons", label: "Buttons", hint: LINK_STYLE_HINT },
  ],

  pillars: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "objectList",
      key: "items",
      label: "Pillars",
      itemLabel: "Pillar",
      fields: [
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description", rows: 2 },
        { kind: "stringList", key: "points", label: "Sub-points", itemLabel: "Point" },
        { kind: "text", key: "href", label: "Link" },
      ],
    },
  ],

  capabilityGrid: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "select",
      key: "columns",
      label: "Columns",
      options: [
        { value: "2", label: "2 columns" },
        { value: "3", label: "3 columns" },
      ],
    },
    { kind: "boolean", key: "showImages", label: "Show photos on the cards" },
    {
      kind: "objectList",
      key: "items",
      label: "Capabilities",
      itemLabel: "Capability",
      fields: [
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description", rows: 2 },
        { kind: "text", key: "href", label: "Link" },
        { kind: "image", key: "imageUrl", label: "Photo" },
        { kind: "text", key: "imageAlt", label: "Photo description", hint: "Required when a photo is set." },
      ],
    },
  ],

  brandGrid: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "text",
      key: "disclaimer",
      label: "Qualifier line",
      hint: "Keep this accurate. Only say “partner” or “authorized dealer” where that is formally true.",
    },
    {
      kind: "select",
      key: "layout",
      label: "Layout",
      options: [
        { value: "grid", label: "Static grid" },
        { value: "marquee", label: "Scrolling strip" },
      ],
    },
    {
      kind: "objectList",
      key: "items",
      label: "Brands",
      itemLabel: "Brand",
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "category", label: "What we use it for" },
        { kind: "image", key: "logoUrl", label: "Logo" },
        { kind: "text", key: "href", label: "Link" },
      ],
    },
  ],

  statusStrip: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "text", key: "href", label: "Status page link" },
    { kind: "text", key: "linkLabel", label: "Link label" },
    {
      kind: "boolean",
      key: "showLiveData",
      label: "Show live measurements",
      description:
        "Reads real monitoring results. Turn this off and the block shows only the heading and link — it never displays made-up figures.",
    },
  ],

  defenseInDepth: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "text", key: "centreLabel", label: "Center label" },
    {
      kind: "objectList",
      key: "layers",
      label: "Layers (outermost first)",
      itemLabel: "Layer",
      fields: [
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description", rows: 2 },
        { kind: "stringList", key: "controls", label: "Example controls", itemLabel: "Control" },
      ],
    },
    { kind: "stringList", key: "threats", label: "Threats addressed", itemLabel: "Threat" },
  ],

  toolGrid: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    { kind: "select", key: "columns", label: "Columns", options: COLUMN_OPTIONS_234 },
    {
      kind: "objectList",
      key: "items",
      label: "Tools",
      itemLabel: "Tool",
      fields: [
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Name" },
        { kind: "textarea", key: "description", label: "What it does", rows: 2 },
        { kind: "text", key: "href", label: "Link" },
        { kind: "text", key: "badge", label: "Badge", hint: "e.g. “Browser only”." },
      ],
    },
  ],

  caseStudyGrid: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "objectList",
      key: "items",
      label: "Case studies",
      itemLabel: "Case study",
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "sector", label: "Sector" },
        { kind: "textarea", key: "problem", label: "Problem", rows: 2 },
        { kind: "textarea", key: "solution", label: "Solution", rows: 2 },
        { kind: "textarea", key: "result", label: "Result", rows: 2 },
        { kind: "text", key: "href", label: "Link" },
        { kind: "image", key: "imageUrl", label: "Photo" },
        { kind: "text", key: "imageAlt", label: "Photo description" },
      ],
    },
  ],

  kbHighlights: [
    { kind: "text", key: "eyebrow", label: "Eyebrow label" },
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "select",
      key: "columns",
      label: "Columns",
      options: [
        { value: "2", label: "2 columns" },
        { value: "3", label: "3 columns" },
      ],
    },
    {
      kind: "objectList",
      key: "items",
      label: "Articles",
      itemLabel: "Article",
      fields: [
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "category", label: "Category" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Summary", rows: 2 },
        { kind: "text", key: "href", label: "Link" },
      ],
    },
    { kind: "links", key: "buttons", label: "Buttons" },
  ],
};

/** Presentation controls shared by every block. */
export const SETTINGS_FIELDS: FieldDef[] = [
  {
    kind: "select",
    key: "background",
    label: "Background",
    options: [
      { value: "white", label: "White" },
      { value: "light", label: "Light gray" },
      { value: "dark", label: "Dark navy" },
      { value: "navy", label: "Navy" },
      { value: "gradient", label: "Navy → blue gradient" },
      { value: "grid", label: "Navy with tech grid" },
      { value: "accent", label: "Cyan accent" },
    ],
  },
  {
    kind: "select",
    key: "paddingY",
    label: "Vertical spacing",
    options: [
      { value: "none", label: "None" },
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
      { value: "xl", label: "Extra large" },
    ],
  },
  {
    kind: "select",
    key: "width",
    label: "Content width",
    options: [
      { value: "narrow", label: "Narrow (reading)" },
      { value: "default", label: "Default" },
      { value: "wide", label: "Wide" },
      { value: "full", label: "Full width" },
    ],
  },
  {
    kind: "select",
    key: "align",
    label: "Text alignment",
    options: [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ],
  },
  {
    kind: "text",
    key: "anchor",
    label: "Anchor ID",
    hint: "Lets you link straight to this section, e.g. #pricing.",
  },
];
