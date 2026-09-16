/**
 * Historic Weebly media URL. Other sites (and our own MistServer posters)
 * still request this exact path. The bytes live in public/brand; Next rewrites
 * the old URL onto that file so the Docker uploads volume cannot hide it.
 */
export const LEGACY_WEEBLY_LOGO_PATH = "/uploads/4/6/3/6/46366157/416823.jpg";

export const LEGACY_WEEBLY_LOGO_FILE = "/brand/legacy-stream-logo.jpg";

/** Partners hard-coded www; both www and the apex serve the same path. */
export const LEGACY_WEEBLY_LOGO_PUBLIC_URL = `https://www.wirelesscom.org${LEGACY_WEEBLY_LOGO_PATH}`;
