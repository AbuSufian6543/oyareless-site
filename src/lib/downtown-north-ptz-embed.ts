import { DOWNTOWN_NORTH_PTZ_SLUG } from "./html-stream-embed";
import { LEGACY_WEEBLY_LOGO_PUBLIC_URL } from "./legacy-weebly-logo";

/**
 * Seed-only vendor snippet. Do not import this from client components —
 * a literal `</script>` in a JS string can break Next.js RSC HTML.
 */
function script(inner: string): string {
  return `<script>${inner}</` + `script>`;
}

export const DOWNTOWN_NORTH_PTZ_EMBED = `<div class="mistvideo" id="downtown-north-ptz_XOj7i42joT3I">
  <noscript>
    <a href="https://videostreamcanada.ca/${DOWNTOWN_NORTH_PTZ_SLUG}.html" target="_blank" rel="noopener noreferrer">
      Click here to play this video
    </a>
  </noscript>
  ${script(`
    var a = function(){
      mistPlay("${DOWNTOWN_NORTH_PTZ_SLUG}",{
        target: document.getElementById("downtown-north-ptz_XOj7i42joT3I"),
        loop: true,
        poster: "${LEGACY_WEEBLY_LOGO_PUBLIC_URL}"
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
  `)}
</div>`;
