/**
 * Default Mist / VideoStreamCanada snippet for the downtown north PTZ demo.
 * Admins edit the live copy under Live Streams; this is only the seed value.
 */
export const DOWNTOWN_NORTH_PTZ_SLUG = "downtown-north-ptz";

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

/** Makes container ids unique so the same snippet can mount more than once. */
export function uniquifyEmbedIds(html: string, suffix: string): string {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(
    (match) => match[1]!,
  );
  const unique = [...new Set(ids)].sort((left, right) => right.length - left.length);
  let next = html;
  for (const id of unique) {
    next = next.split(id).join(`${id}-${suffix}`);
  }
  return next;
}
