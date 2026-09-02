/**
 * Default Mist / VideoStreamCanada snippet for the downtown north PTZ demo.
 * Admins edit the live copy under Live Streams; this is only the seed value.
 */
export const DOWNTOWN_NORTH_PTZ_SLUG = "downtown-north-ptz";

export const MIST_PLAYER_SCRIPT_URL =
  "https://videostreamcanada.ca/player.js";

export const DOWNTOWN_NORTH_PTZ_EMBED = `<div class="mistvideo" id="downtown-north-ptz_XOj7i42joT3I">
  <noscript>
    <a href="https://videostreamcanada.ca/downtown-north-ptz.html" target="_blank" rel="noopener noreferrer">
      Click here to play this video
    </a>
  </noscript>
  <script>
    var a = function(){
      mistPlay("downtown-north-ptz",{
        target: document.getElementById("downtown-north-ptz_XOj7i42joT3I"),
        loop: true,
        poster: "https://www.wirelesscom.org/uploads/4/6/3/6/46366157/416823.jpg"
      });
    };
    if (!window.mistplayers) {
      var p = document.createElement("script");
      if (location.protocol == "https:") { p.src = "https://videostreamcanada.ca/player.js" }
      else { p.src = "http://videostreamcanada.ca/player.js" }
      document.head.appendChild(p);
      p.onload = a;
    }
    else { a(); }
  </script>
</div>`;

export type ParsedMistEmbed = {
  streamName: string;
  loop: boolean;
  poster: string | null;
  fallbackHref: string | null;
};

/** True when pasted markup is a Mist / VideoStreamCanada player, not a plain iframe. */
export function looksLikeMistEmbed(html: string): boolean {
  return (
    /mistPlay\s*\(/.test(html) ||
    /videostreamcanada\.ca\/player\.js/i.test(html) ||
    /class\s*=\s*["']mistvideo["']/i.test(html)
  );
}

/**
 * Reads mistPlay("name", { loop, poster }) from the vendor snippet so the
 * site can call mistPlay itself with a React-managed container.
 */
export function parseMistEmbed(html: string): ParsedMistEmbed | null {
  const nameMatch = html.match(/mistPlay\s*\(\s*(["'])([^"']+)\1/);
  if (!nameMatch?.[2]) return null;

  const posterMatch = html.match(/\bposter\s*:\s*(["'])([^"']*)\1/);
  const hrefMatch = html.match(/<a\b[^>]*\bhref\s*=\s*(["'])([^"']+)\1/i);

  return {
    streamName: nameMatch[2],
    loop: /\bloop\s*:\s*true\b/.test(html),
    poster: posterMatch?.[2] || null,
    fallbackHref: hrefMatch?.[2] ?? null,
  };
}

/** Vendor snippets ship an http player.js branch; this site is always HTTPS. */
export function rewriteInsecureMistPlayer(html: string): string {
  return html.replace(
    /http:\/\/videostreamcanada\.ca\/player\.js/gi,
    MIST_PLAYER_SCRIPT_URL,
  );
}

/**
 * Makes container ids unique so the same snippet can mount more than once.
 * Only rewrites id="…" and getElementById("…") so mistPlay("stream-name")
 * is left alone when the DOM id happens to equal the stream name.
 */
export function uniquifyEmbedIds(html: string, suffix: string): string {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(
    (match) => match[1]!,
  );
  const unique = [...new Set(ids)].sort((left, right) => right.length - left.length);
  let next = html;
  for (const id of unique) {
    const escaped = escapeRegExp(id);
    next = next.replace(
      new RegExp(`\\bid=(["'])${escaped}\\1`, "gi"),
      `id=$1${id}-${suffix}$1`,
    );
    next = next.replace(
      new RegExp(`getElementById\\((["'])${escaped}\\1\\)`, "g"),
      `getElementById($1${id}-${suffix}$1)`,
    );
  }
  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
