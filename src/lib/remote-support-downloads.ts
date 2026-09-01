/**
 * Official vendor download URLs for the remote-support agents.
 *
 * Used when an admin has not hosted their own copy. AnyDesk publishes
 * unversioned Windows and macOS installers. Their Debian package is named
 * with a version, as is RustDesk; an admin can replace any URL under Remote
 * Support settings without a redeploy.
 *
 * These names describe software we use to help. They do not imply a
 * partnership or endorsement.
 */

const RUSTDESK_VERSION = "1.4.9";
const RUSTDESK_ASSET = `https://github.com/rustdesk/rustdesk/releases/download/${RUSTDESK_VERSION}`;

export const RUSTDESK_RELEASES_PAGE =
  "https://github.com/rustdesk/rustdesk/releases/latest";

export const OFFICIAL_AGENT_DOWNLOADS = {
  rustdesk: {
    windows: `${RUSTDESK_ASSET}/rustdesk-${RUSTDESK_VERSION}-x86_64.exe`,
    macos: `${RUSTDESK_ASSET}/rustdesk-${RUSTDESK_VERSION}-aarch64.dmg`,
    macosIntel: `${RUSTDESK_ASSET}/rustdesk-${RUSTDESK_VERSION}-x86_64.dmg`,
    debian: `${RUSTDESK_ASSET}/rustdesk-${RUSTDESK_VERSION}-x86_64.deb`,
  },
  anydesk: {
    windows: "https://download.anydesk.com/AnyDesk.exe",
    macos: "https://download.anydesk.com/anydesk.dmg",
    debian: "https://download.anydesk.com/linux/anydesk_8.0.4-1_amd64.deb",
  },
} as const;

/** Admin-configured URL wins; blank falls back to the official vendor file. */
export function remoteAgentHref(
  configured: string | undefined,
  official: string,
): string {
  const value = configured?.trim() ?? "";
  return value || official;
}
