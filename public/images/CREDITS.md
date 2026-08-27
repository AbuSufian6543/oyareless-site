# Image credits and provenance

Derivatives in this folder are built by `node scripts/build-site-images.mjs`.
Each entry below records where its master came from.

Widths: 1400, 900, 560 px, in AVIF and WebP, cropped to 16:10.

## Generated imagery

Produced for this site, so there is no third-party licence attached. The
prompt is recorded so a replacement can be produced in the same style.

### `server-rack`

- **Alt text:** Row of rack-mounted enterprise servers in a dark data centre aisle lit by blue status indicators
- **Prompt:** Modern enterprise server rack in a clean data centre aisle, dark navy and near-black, cyan and blue status LEDs as the only accent, neatly dressed cabling, shallow depth of field, cinematic premium B2B look.

### `wifi`

- **Alt text:** White enterprise Wi-Fi access point mounted on a dark office ceiling with a blue status ring
- **Prompt:** Modern white enterprise Wi-Fi access point on a dark ceiling in a contemporary office, faint cool blue status glow, blurred glass-partitioned office behind, navy colour grading.

### `surveillance`

- **Alt text:** Dome and bullet security cameras mounted under the soffit of a modern commercial building at dusk
- **Prompt:** Dome and bullet security cameras on the exterior soffit of a contemporary dark grey commercial building at dusk, cool blue evening sky, cyan reflection on the housings, architectural security photography.

### `cybersecurity`

- **Alt text:** Abstract shield formed from connected cyan nodes and lines over a dark navy grid
- **Prompt:** Abstract geometric shield built from thin cyan and blue line-work and connected nodes over deep navy with a faint grid. No padlocks, keyboards, hooded figures, matrix code or binary.

### `voip`

- **Alt text:** Black executive VoIP desk phone with a colour display on a dark office desk
- **Prompt:** Modern black executive VoIP desk phone with colour display and corded handset on a dark desk, cool blue and cyan rim lighting, deep navy blurred office background.

### `two-way-radio`

- **Alt text:** Three rugged professional handheld two-way radios on a dark surface with blue rim lighting
- **Prompt:** Two rugged black professional handheld two-way radios standing upright with a third lying beside them on dark charcoal, cool blue rim lighting, deep navy gradient background.

### `remote-support`

- **Alt text:** Support technician wearing a headset at a desk with two monitors showing dashboards, seen from behind
- **Prompt:** Support technician at a desk in a headset viewed from behind over the shoulder, two monitors with abstract out-of-focus dashboards in cool blue, dark navy office, cyan screen glow.

### `cabling-install`

- **Alt text:** Technician's hands terminating blue and white network cables into a rack-mounted patch panel
- **Prompt:** Technician in a dark navy work shirt terminating network cables into a rack-mounted patch panel, neatly bundled blue and white cables, cool cyan work light, face not visible.

### `firewall`

- **Alt text:** Rack-mounted next-generation firewall appliances in a dark cabinet with cyan status lights and dressed ethernet
- **Prompt:** Rack-mounted next-generation firewall appliances in a dark enterprise cabinet, generic unbranded black hardware, cyan and blue status LEDs, neatly dressed ethernet, no logos or text.

### `ai-camera`

- **Alt text:** IP dome camera in the foreground with a security monitor showing cyan AI detection overlays on a night-time scene
- **Prompt:** Professional IP dome camera in the foreground of a dark security desk, monitor showing abstract cyan bounding-box overlays on a muted night feed, no logos or readable UI text.

### `ai-phone`

- **Alt text:** Black executive VoIP desk phone whose display shows an abstract cyan assistant waveform
- **Prompt:** Modern black executive VoIP desk phone on a dark desk, colour display showing an abstract cyan assistant waveform, cool blue rim lighting, no logos or readable brand names.

## CC0 photography

Sourced via the Openverse API filtered to CC0. CC0 places the work in the
public domain and imposes no attribution requirement; sources are listed so
provenance stays auditable.

| File | Title | Source | Licence | Landing page |
| --- | --- | --- | --- | --- |
| `networking-*` | Feeling Wired | rawpixel | CC0 | https://www.rawpixel.com/image/5975692/feeling-wired |
| `cabling-*` | Fiber Optics Close-Up | rawpixel | CC0 | https://www.rawpixel.com/image/5966166/fiber-optics-close-up |

## Photographs owned by WirelessCom.Ca Inc.

These live in `public/brand/` and are the company's own field photography:
`home-hero.png` (the Sault Ste. Marie office at dusk), `internet-1.jpg`
through `internet-5.jpg` (wireless relay and antenna installations) and
`marketing-1.png` / `marketing-2.png` (digital signage installations).

## Full-bleed backgrounds

Hero and section backgrounds use `src/components/visuals/TechBackdrop`
instead of a photograph — a gradient, grid and animated node mesh drawn in
the browser. It scales to any viewport and carries no licence obligations.
